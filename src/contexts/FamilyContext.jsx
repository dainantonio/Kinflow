import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  DEMO_MODE, auth, db, appId,
  signInWithCustomToken, signInAnonymously, onAuthStateChanged,
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc
} from '../utils/firebase';
import { createAgentProcedures } from '../server/trpc/agentProcedures';
import { createChatSocketClient } from '../realtime/chatSocket';

export const AVATAR_OPTIONS = {
  parent_female: ['👩🏾', '👩🏿', '👩🏽', '👩🏼', '👩🏻', '👩'],
  parent_male: ['👨🏾', '👨🏿', '👨🏽', '👨🏼', '👨🏻', '👨'],
  child_girl: ['👧🏾', '👧🏿', '👧🏽', '👧🏼', '👧🏻', '👧'],
  child_boy: ['👦🏾', '👦🏿', '👦🏽', '👦🏼', '👦🏻', '👦'],
};

export const ALL_AVATARS = [
  '👩🏾', '👨🏾', '👧🏾', '👦🏾',
  '👩🏿', '👨🏿', '👧🏿', '👦🏿',
  '👩🏽', '👨🏽', '👧🏽', '👦🏽',
  '👩🏼', '👨🏼', '👧🏼', '👦🏼',
  '👩🏻', '👨🏻', '👧🏻', '👦🏻',
  '🧑🏾', '🧒🏾', '👸🏾', '🤴🏾',
];

// --- THEME CONTEXT ---
export const ThemeContext = createContext({ isChild: false, user: null });

// --- FAMILY CONTEXT ---
const FamilyContext = createContext(null);

export const useFamilyContext = () => {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamilyContext must be used within FamilyProvider');
  return ctx;
};

export const FamilyProvider = ({ children }) => {
  const agentProceduresRef = useRef(createAgentProcedures());
  const chatSocketRef = useRef(null);
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kinflow_lastProfile');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
  });
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try { return localStorage.getItem('kinflow_loggedIn') === 'true'; } catch(e) { return false; }
  });

  const [confirmActionState, setConfirmActionState] = useState(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [latestToast, setLatestToast] = useState(null);

  // Database States
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [userPoints, setUserPoints] = useState({});
  const [events, setEvents] = useState([]);
  const [meals, setMeals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [agentPreferences, setAgentPreferences] = useState({});

  // Family Members State
  const [familyMembers, setFamilyMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('kinflow_familyMembers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [];
  });

  // Non-Firebase States
  const [groceries, setGroceries] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [lastRedeemed, setLastRedeemed] = useState(null);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('orbit_theme') || 'indigo'; } catch(e) { return 'indigo'; }
  });

  const prevNotifsLength = useRef(0);

  const isParent = activeUser?.role === 'Parent';
  const isChild = activeUser?.role === 'Child';

  // Dynamic Greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    if (DEMO_MODE) { setFirebaseUser({ uid: 'demo-user' }); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase Auth Error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, user => setFirebaseUser(user));
    return () => unsubscribe();
  }, []);

  // Persist familyMembers to localStorage in DEMO_MODE
  useEffect(() => {
    if (DEMO_MODE) {
      try { localStorage.setItem('kinflow_familyMembers', JSON.stringify(familyMembers)); } catch(e) {}
    }
  }, [familyMembers]);

  // Sync DB
  useEffect(() => {
    if (!firebaseUser) return;
    if (DEMO_MODE) {
      setTasks([]);
      setMessages([]);
      setUserPoints({});
      setEvents([]);
      setMeals([]);
      return;
    }
    const dataPath = 'public';
    const collPath = 'data';

    const tasksRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_tasks');
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      if (snap.empty) setTasks([]);
      else setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const msgsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_messages');
    const unsubMsgs = onSnapshot(msgsRef, (snap) => {
      if (snap.empty) setMessages([]);
      else setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const pointsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_points');
    const unsubPoints = onSnapshot(pointsRef, (snap) => {
      if (snap.empty) {
        setUserPoints({});
      } else {
        let p = {};
        snap.docs.forEach(d => { p[d.id] = d.data().points; });
        setUserPoints(p);
      }
    }, console.error);

    const eventsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_events');
    const unsubEvents = onSnapshot(eventsRef, (snap) => {
      if (snap.empty) setEvents([]);
      else setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const mealsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_meals');
    const unsubMeals = onSnapshot(mealsRef, (snap) => {
      if (snap.empty) setMeals([]);
      else setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    // Family members collection
    const familyRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_family');
    const unsubFamily = onSnapshot(familyRef, (snap) => {
      if (snap.empty) {
        setFamilyMembers([]);
      } else {
        setFamilyMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }, console.error);

    const notifRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_notifications');
    const unsubNotifs = onSnapshot(notifRef, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, console.error);

    return () => { unsubTasks(); unsubMsgs(); unsubPoints(); unsubEvents(); unsubMeals(); unsubFamily(); unsubNotifs(); };
  }, [firebaseUser]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!activeUser) return undefined;
    const socket = createChatSocketClient({
      userId: activeUser.id,
      onMessage: (incoming) => {
        const mapped = {
          id: incoming.id,
          senderId: incoming.senderId,
          text: incoming.text,
          time: new Date(incoming.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: incoming.createdAt,
          suggestions: incoming.suggestions || [],
          type: incoming.type || 'chat_message',
        };
        if (DEMO_MODE) {
          setMessages((prev) => [...prev, mapped]);
        }
      },
    });

    chatSocketRef.current = socket;
    return () => socket.close();
  }, [activeUser]);

  // TOAST PUSH NOTIFICATION LISTENER
  useEffect(() => {
    if (activeUser && notifications.length > prevNotifsLength.current && prevNotifsLength.current !== 0) {
       const newest = [...notifications].sort((a,b) => b.createdAt - a.createdAt)[0];
       const isForMe = isParent ? newest.target === 'Parent' : newest.target === activeUser.name;
       if (newest && isForMe && newest.createdAt > Date.now() - 5000) {
           setLatestToast(newest);
           setTimeout(() => setLatestToast(null), 4500);
       }
    }
    prevNotifsLength.current = notifications.length;
  }, [notifications, activeUser, isParent]);

  const handleLogin = (user) => {
    setActiveUser(user);
    setActiveTab('home');
    try { localStorage.setItem('kinflow_lastProfile', JSON.stringify(user)); } catch(e) {}
    if (!hasOnboarded) setShowOnboarding(true);
  };

  const triggerConfetti = () => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setHasOnboarded(true);
    triggerConfetti();
  };

  // --- FAMILY MEMBER MANAGEMENT ---

  const handleAddMember = async (member) => {
    const newId = Date.now().toString();
    const newMember = { id: newId, ...member, initials: member.name?.charAt(0)?.toUpperCase() || '?' };
    if (DEMO_MODE) {
      setFamilyMembers(prev => [...prev, newMember]);
      // Initialize points to 0 for new member
      setUserPoints(prev => ({ ...prev, [newMember.name]: 0 }));
      return;
    }
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_family', newId), { ...newMember, createdAt: Date.now() });
    // Initialize points to 0
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_points', newMember.name), { points: 0 });
  };

  const handleUpdateMember = async (updatedMember) => {
    // Find the old member to check for name change
    const oldMember = familyMembers.find(m => m.id === updatedMember.id);
    const nameChanged = oldMember && oldMember.name !== updatedMember.name;

    if (DEMO_MODE) {
      setFamilyMembers(prev => prev.map(m => m.id === updatedMember.id ? { ...m, ...updatedMember } : m));
      // Migrate points if name changed
      if (nameChanged) {
        setUserPoints(prev => {
          const pts = prev[oldMember.name] || 0;
          const next = { ...prev, [updatedMember.name]: pts };
          delete next[oldMember.name];
          return next;
        });
      }
      return;
    }
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_family', updatedMember.id), updatedMember);
    // Migrate points if name changed
    if (nameChanged) {
      const oldPoints = userPoints[oldMember.name] || 0;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_points', updatedMember.name), { points: oldPoints });
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_points', oldMember.name));
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (DEMO_MODE) {
      setFamilyMembers(prev => prev.filter(m => m.id !== memberId));
      return;
    }
    if (!firebaseUser) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_family', memberId));
  };

  // --- NOTIFICATION DISPATCHER ---
  const sendNotification = async (title, body, targetUserOrRole) => {
    const newId = Date.now().toString();
    const notifData = { id: newId, title, body, target: targetUserOrRole, createdAt: Date.now(), read: false };
    if (DEMO_MODE) { setNotifications(prev => [...prev, notifData]); return; }
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_notifications', newId), notifData);
  };

  // --- ACTIONS ---

  const handleAddTask = async (newTask) => {
    const newId = Date.now().toString();
    const taskData = { ...newTask, id: newId, status: 'open', createdAt: Date.now() };
    if (DEMO_MODE) { setTasks(prev => [...prev, taskData]); return; }
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_tasks', newId), taskData);
    if (newTask.assignee && newTask.assignee !== 'Anyone') {
      sendNotification("New Chore", `You were assigned a new chore: "${newTask.title}"`, newTask.assignee);
    }
  };


  const handleUpdateTask = async (updatedTask) => {
    if (!updatedTask?.id) return;
    if (DEMO_MODE) {
      setTasks(prev => prev.map(t => String(t.id) === String(updatedTask.id) ? { ...t, ...updatedTask } : t));
      return;
    }
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_tasks', updatedTask.id.toString()), updatedTask);
  };

  const requestDeleteTask = (id) => {
    setConfirmActionState({ title: 'Delete Task', message: 'Are you sure you want to permanently remove this chore?', onConfirm: async () => {
      if (DEMO_MODE) { setTasks(prev => prev.filter(t => String(t.id) !== String(id))); }
      else await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_tasks', id.toString()));
      setConfirmActionState(null);
    }});
  };

  const handleTaskAction = async (taskId, action, extra = {}) => {
    const t = tasks.find(x => x.id === taskId || String(x.id) === String(taskId));
    if (!t || (!DEMO_MODE && !firebaseUser)) return;

    const assignee = t.assignee;
    let newStatus = t.status;
    let newPhotoUrl = t.photoUrl || null;
    let pointsChange = 0;
    let notifToSent = null;

    if (action === 'toggle_simple') {
      if (isParent) {
        if (t.status === 'open') {
          pointsChange = t.points; newStatus = 'approved';
          notifToSent = { title: "Task Approved", body: `Your parent approved "${t.title}"!`, target: assignee };
        }
        else { pointsChange = -t.points; newStatus = 'open'; }
      } else {
        if (t.status === 'open') {
          newStatus = 'pending';
          notifToSent = { title: "Chore Completed", body: `${activeUser.name} finished "${t.title}".`, target: 'Parent' };
        }
        else if (t.status === 'pending') newStatus = 'open';
      }
    }
    else if (action === 'submit_with_photo') {
      newStatus = 'pending';
      newPhotoUrl = extra.photoUrl;
      notifToSent = { title: "Proof Submitted", body: `${activeUser.name} submitted photo proof for "${t.title}".`, target: 'Parent' };
    }
    else if (action === 'approve') {
      pointsChange = t.points;
      newStatus = 'approved';
      notifToSent = { title: "Task Approved", body: `Great job! "${t.title}" was approved. (+${t.points}pts)`, target: assignee };
    }
    else if (action === 'reject') {
      newStatus = 'open';
      newPhotoUrl = null;
      const fb = extra.feedback ? ` Feedback: "${extra.feedback}"` : '';
      notifToSent = { title: "Needs Work", body: `Your parent asked you to redo "${t.title}".${fb}`, target: assignee };
    }

    if (newStatus === 'pending' || newStatus === 'approved') {
      if (t.status !== newStatus && action !== 'reject') triggerConfetti();
    }

    if (DEMO_MODE) {
      const feedbackText = (action === 'reject' && extra.feedback) ? extra.feedback : null;
      setTasks(prev => prev.map(x => String(x.id) === String(taskId) ? { ...x, status: newStatus, photoUrl: newPhotoUrl, feedback: feedbackText || x.feedback } : x));
      if (pointsChange !== 0 && assignee) {
        setUserPoints(prev => ({ ...prev, [assignee]: Math.max(0, (prev[assignee] || 0) + pointsChange) }));
      }
      return;
    }
    const updatePayload = { status: newStatus, photoUrl: newPhotoUrl };
    if (action === 'reject' && extra.feedback) updatePayload.feedback = extra.feedback;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_tasks', taskId.toString()), updatePayload);

    if (pointsChange !== 0 && assignee) {
      const currentPoints = userPoints[assignee] || 0;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_points', assignee), { points: Math.max(0, currentPoints + pointsChange) }, { merge: true });
    }

    if (notifToSent && notifToSent.target !== 'Anyone') {
      sendNotification(notifToSent.title, notifToSent.body, notifToSent.target);
    }
  };

  const handleSendMessage = async (text) => {
    if (!activeUser) return;
    const newId = Date.now().toString();
    const msgData = { id: newId, senderId: activeUser.id, text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), createdAt: Date.now() };
    if (DEMO_MODE) {
      setMessages(prev => [...prev, msgData]);
      chatSocketRef.current?.send(text, {
        tasks,
        mealHistory: meals,
        events,
        inventory: groceries,
      });
      return;
    }
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_messages', newId), msgData);

    const result = await agentProceduresRef.current.executeAgent({
      agent: 'conversation',
      payload: {
        message: text,
        tasks,
        mealHistory: meals,
        events,
        inventory: groceries,
      },
      context: { userId: activeUser.id },
    });

    const replyId = `${Date.now()}-agent`;
    const reply = {
      id: replyId,
      senderId: 'conversation-agent',
      text: result.responseText,
      suggestions: result.suggestions,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      type: 'agent_message',
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_messages', replyId), reply);
  };

  const executeAgent = (agent, payload = {}) => agentProceduresRef.current.executeAgent({ agent, payload, context: { userId: activeUser?.id } });
  const approveAgentSuggestion = (suggestionId, approved = true) => agentProceduresRef.current.approveSuggestion({ suggestionId, approved, userId: activeUser?.id });
  const provideAgentFeedback = (suggestionId, feedback, rating) => agentProceduresRef.current.provideFeedback({ suggestionId, feedback, rating, userId: activeUser?.id });
  const getAgentPreferences = async (agent) => {
    const response = await agentProceduresRef.current.getAgentPreferences({ agent });
    setAgentPreferences((prev) => ({ ...prev, [agent]: response.preferences }));
    return response;
  };
  const updateAgentPreferences = async (agent, preferences) => {
    const response = await agentProceduresRef.current.updateAgentPreferences({ agent, preferences });
    setAgentPreferences((prev) => ({ ...prev, [agent]: response.preferences }));
    return response;
  };

  const requestDeleteMessage = (id) => {
    setConfirmActionState({ title: 'Delete Message', message: 'Remove this message for everyone in the family?', onConfirm: async () => {
      if (DEMO_MODE) { setMessages(prev => prev.filter(m => String(m.id) !== String(id))); }
      else await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_messages', id.toString()));
      setConfirmActionState(null);
    }});
  };

  const handleRedeemReward = async (cost, rewardTitle) => {
    if (!activeUser) return;
    const pointsAvailable = userPoints[activeUser.name] || 0;
    if (!isParent && pointsAvailable >= cost) {
      if (DEMO_MODE) {
        setUserPoints(prev => ({ ...prev, [activeUser.name]: Math.max(0, (prev[activeUser.name] || 0) - cost) }));
      } else {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_points', activeUser.name), { points: pointsAvailable - cost }, { merge: true });
        sendNotification('Reward Redeemed', `${activeUser.name} just redeemed "${rewardTitle}" for ${cost} pts!`, 'Parent');
      }
      setLastRedeemed({ title: rewardTitle, cost });
      triggerConfetti();
      setTimeout(() => setLastRedeemed(null), 3500);
    } else if (isParent) triggerConfetti();
  };

  const handleAddEvent = async (newEvent) => {
    const newId = Date.now().toString();
    const eventData = { ...newEvent, id: newId, color: 'bg-indigo-500', createdAt: Date.now() };
    if (DEMO_MODE) { setEvents(prev => [...prev, eventData]); return; }
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_events', newId), eventData);
  };


  const handleUpdateEvent = async (updatedEvent) => {
    if (!updatedEvent?.id) return;
    if (DEMO_MODE) {
      setEvents(prev => prev.map(e => String(e.id) === String(updatedEvent.id) ? { ...e, ...updatedEvent } : e));
      return;
    }
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_events', updatedEvent.id.toString()), updatedEvent);
  };

  const requestDeleteEvent = (id) => {
    setConfirmActionState({ title: 'Delete Event', message: 'Are you sure you want to remove this event from the calendar?', onConfirm: async () => {
      if (DEMO_MODE) { setEvents(prev => prev.filter(e => String(e.id) !== String(id))); }
      else await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_events', id.toString()));
      setConfirmActionState(null);
    }});
  };

  const handleAddMeal = async (newMeal) => {
    const newId = Date.now().toString();
    const mealData = { ...newMeal, id: newId, tags: ['New Recipe'], createdAt: Date.now() };
    if (DEMO_MODE) { setMeals(prev => [...prev, mealData]); return; }
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_meals', newId), mealData);
  };

  const handleUpdateMeal = async (updatedMeal) => {
    if (DEMO_MODE) { setMeals(prev => prev.map(m => String(m.id) === String(updatedMeal.id) ? { ...m, ...updatedMeal } : m)); return; }
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_meals', updatedMeal.id.toString()), updatedMeal);
  };

  const requestDeleteMeal = (id) => {
    setConfirmActionState({ title: 'Delete Recipe', message: 'Are you sure you want to permanently delete this recipe?', onConfirm: async () => {
      if (DEMO_MODE) { setMeals(prev => prev.filter(m => String(m.id) !== String(id))); }
      else await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_meals', id.toString()));
      setConfirmActionState(null);
    }});
  };

  const handleUpdateProfile = (updatedUser) => {
    setActiveUser(updatedUser);
    try { localStorage.setItem('kinflow_lastProfile', JSON.stringify(updatedUser)); } catch(e) {}
    // Also update the member in familyMembers
    const oldMember = familyMembers.find(m => m.id === updatedUser.id);
    if (oldMember) {
      handleUpdateMember({ ...oldMember, ...updatedUser, initials: updatedUser.name?.charAt(0)?.toUpperCase() || oldMember.initials });
    }
    setLatestToast({ id: Date.now().toString(), title: 'Profile Updated', body: `Display name changed to "${updatedUser.name}"`, createdAt: Date.now() });
    setTimeout(() => setLatestToast(null), 3500);
  };

  // Filter My Notifications
  const myNotifications = notifications
    .filter(n => isParent ? n.target === 'Parent' : n.target === activeUser?.name)
    .sort((a,b) => b.createdAt - a.createdAt);
  const unreadNotifsCount = myNotifications.filter(n => !n.read).length;

  const markNotifsAsRead = () => {
    if (DEMO_MODE) { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); return; }
    myNotifications.forEach(async (n) => {
      if (!n.read && firebaseUser) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_notifications', n.id), { read: true });
      }
    });
  };


  useEffect(() => {
    try { localStorage.setItem('orbit_theme', theme); } catch(e) {}
  }, [theme]);

  const value = {
    // State
    showSplash, activeTab, setActiveTab,
    moreMenuOpen, setMoreMenuOpen,
    isProfileMenuOpen, setIsProfileMenuOpen,
    activeUser, setActiveUser,
    isUserSwitcherOpen, setIsUserSwitcherOpen,
    hasOnboarded, showOnboarding, setShowOnboarding,
    isLoggedIn, setIsLoggedIn,
    confirmActionState, setConfirmActionState,
    isNotifModalOpen, setIsNotifModalOpen,
    latestToast,
    tasks, messages, userPoints, events, meals, notifications,
    agentPreferences,
    groceries, setGroceries,
    showConfetti, isCopilotOpen, setIsCopilotOpen,
    lastRedeemed,
    theme, setTheme,
    isParent, isChild, greeting,
    familyMembers,

    // Actions
    handleLogin, completeOnboarding, triggerConfetti,
    handleAddTask, handleUpdateTask, requestDeleteTask, handleTaskAction,
    handleSendMessage, requestDeleteMessage,
    executeAgent, approveAgentSuggestion, provideAgentFeedback,
    getAgentPreferences, updateAgentPreferences,
    handleRedeemReward,
    handleAddEvent, handleUpdateEvent, requestDeleteEvent,
    handleAddMeal, handleUpdateMeal, requestDeleteMeal,
    handleUpdateProfile,
    handleAddMember, handleUpdateMember, handleRemoveMember,
    myNotifications, unreadNotifsCount, markNotifsAsRead,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};
