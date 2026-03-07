import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  DEMO_MODE, auth, db, appId,
  signInWithCustomToken, signInAnonymously, onAuthStateChanged,
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc
} from '../utils/firebase';
import { createAgentProcedures } from '../server/trpc/agentProcedures';
import { createChatSocketClient } from '../realtime/chatSocket';
import { taskAgent } from '../agents/taskAgent';
import { mealAgent } from '../agents/mealAgent';
import { scheduleAgent } from '../agents/scheduleAgent';

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
  const [activeTab, setActiveTab] = useState(() => { try { return localStorage.getItem('kinflow_activeTab') || 'home'; } catch(e) { return 'home'; } });
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
  const [hasOnboarded, setHasOnboarded] = useState(() => { try { return localStorage.getItem('kinflow_hasOnboarded') === 'true'; } catch(e) { return false; } });
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
  const [agentSuggestions, setAgentSuggestions] = useState([]);
  const [agentFeedback, setAgentFeedback] = useState([]);

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

  const formatMessageTime = (value) => {
    const numeric = typeof value === 'number' ? value : (typeof value?.toMillis === 'function' ? value.toMillis() : Date.now());
    const parsed = new Date(numeric);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isParent = activeUser?.role === 'Parent';
  const isChild = activeUser?.role === 'Child';

  useEffect(() => {
    try { localStorage.setItem('kinflow_activeTab', activeTab); } catch(e) {}
  }, [activeTab]);

  useEffect(() => {
    try { localStorage.setItem('kinflow_hasOnboarded', String(hasOnboarded)); } catch(e) {}
  }, [hasOnboarded]);

  // Dynamic Greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    if (DEMO_MODE) { setFirebaseUser({ uid: 'demo-user' }); return; }
    // Observe only — App.jsx owns the sign-in flow.
    // DO NOT call signInAnonymously here. It overwrites the Google credential
    // and causes an infinite loop: Google → anonymous → isLoggedIn=false → AuthScreen → repeat.
    if (!auth) return;
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

    const suggestionsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_agent_suggestions');
    const unsubSuggestions = onSnapshot(suggestionsRef, (snap) => {
      setAgentSuggestions(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, () => setAgentSuggestions([]));

    const feedbackRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_agent_feedback');
    const unsubFeedback = onSnapshot(feedbackRef, (snap) => {
      setAgentFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    }, () => setAgentFeedback([]));

    return () => { unsubTasks(); unsubMsgs(); unsubPoints(); unsubEvents(); unsubMeals(); unsubFamily(); unsubNotifs(); unsubSuggestions(); unsubFeedback(); };
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
          time: formatMessageTime(incoming.createdAt),
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
    try { localStorage.setItem('kinflow_hasOnboarded', 'true'); } catch(e) {}
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
    else if (action === 'assign') {
      if (DEMO_MODE) {
        setTasks(prev => prev.map(x => String(x.id) === String(taskId) ? { ...x, assignee: extra.assignee || 'Anyone' } : x));
        return;
      }
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_tasks', taskId.toString()), { assignee: extra.assignee || 'Anyone' });
      return;
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

    try {
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
    } catch (error) {
      console.error('Conversation agent failed:', error);
    }
  };

  const executeAgent = async (agent, payload = {}) => {
    const result = await agentProceduresRef.current.executeAgent({ agent, payload, context: { userId: activeUser?.id } });
    if (!DEMO_MODE && firebaseUser && Array.isArray(result?.suggestions)) {
      await Promise.all(result.suggestions.map(async (suggestion) => {
        const suggestionId = suggestion.id || `${Date.now()}-${Math.round(Math.random() * 1000)}`;
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_agent_suggestions', suggestionId), {
          ...suggestion,
          id: suggestionId,
          agent,
          status: 'proposed',
          createdAt: Date.now(),
        }, { merge: true });
      }));
    }
    return result;
  };
  const provideAgentFeedback = (suggestionId, feedback, rating) => agentProceduresRef.current.provideFeedback({ suggestionId, feedback, rating, userId: activeUser?.id });

  const persistSuggestionFeedback = async (suggestion, approved) => {
    const feedbackId = `${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const record = {
      id: feedbackId,
      suggestionId: suggestion.id,
      suggestionType: suggestion.type || suggestion.agent || 'unknown',
      assignee: suggestion?.payload?.assignee || null,
      approved,
      userId: activeUser?.id || 'unknown',
      timestamp: Date.now(),
    };
    if (DEMO_MODE || !firebaseUser) return record;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_agent_feedback', feedbackId), record);
    return record;
  };

  const executeSuggestionAction = async (suggestion) => {
    const payload = suggestion.payload || {};
    switch (suggestion.type) {
      case 'assignment':
        if (payload.taskId) await handleTaskAction(payload.taskId, 'assign', { assignee: payload.assignee });
        break;
      case 'meal_plan':
        await handleAddMeal({ meal: payload.mealName || suggestion.title, day: payload.day || 'This Week', prepTime: payload.prepMinutes ? `${payload.prepMinutes}m prep` : '30m prep' });
        break;
      case 'timeslot':
      case 'conflict':
        break;
      case 'reminder':
        await sendNotification('Task Reminder', suggestion.title, 'Parent');
        break;
      case 'reward_alert':
        await sendNotification('Reward Alert', suggestion.title, activeUser?.name || 'Parent');
        break;
      case 'chore_rotate':
        if (payload.taskId && payload.assignee) await handleUpdateTask({ id: payload.taskId, assignee: payload.assignee });
        break;
      default:
        break;
    }
  };

  const approveAgentSuggestion = async (suggestion, approved = true) => {
    const suggestionId = typeof suggestion === 'string' ? suggestion : suggestion?.id;
    if (!suggestionId) return { ok: false };
    await agentProceduresRef.current.approveSuggestion({ suggestionId, approved, userId: activeUser?.id });
    const fullSuggestion = typeof suggestion === 'string' ? agentSuggestions.find((item) => String(item.id) === String(suggestionId)) : suggestion;
    if (fullSuggestion) {
      if (approved) await executeSuggestionAction(fullSuggestion);
      await persistSuggestionFeedback(fullSuggestion, approved);
      if (!DEMO_MODE && firebaseUser) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_agent_suggestions', suggestionId.toString()), { status: approved ? 'approved' : 'dismissed', reviewedAt: Date.now() });
      }
    }
    return { ok: true };
  };

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

  const handleUpdateNotificationPrefs = async (prefs) => {
    if (!activeUser) return;
    const updatedUser = { ...activeUser, notificationPrefs: { ...(activeUser.notificationPrefs || {}), ...(prefs || {}) } };
    handleUpdateProfile(updatedUser);
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

  const generatedTaskSuggestions = taskAgent.execute({ prompt: 'assign review overdue', tasks, familyMembers }).suggestions || [];
  const generatedMealSuggestions = mealAgent.execute({ prompt: 'healthy family meals', inventory: groceries, mealHistory: meals, familySize: familyMembers.length || 4 }).suggestions || [];
  const generatedScheduleSuggestions = scheduleAgent.execute({ events }).suggestions || [];

  const activeSuggestions = [
    ...agentSuggestions.filter((item) => (item.status || 'proposed') === 'proposed'),
    ...generatedTaskSuggestions.map((item) => ({ ...item, agent: item.agent || 'task' })),
    ...generatedMealSuggestions.map((item) => ({ ...item, agent: item.agent || 'meal' })),
    ...generatedScheduleSuggestions.map((item) => ({ ...item, agent: item.agent || 'schedule' })),
  ];

  const getFeedbackMultiplier = (suggestion) => {
    const matches = agentFeedback.filter((f) => f.suggestionType === suggestion.type);
    if (matches.length === 0) return 1;
    const approvals = matches.filter((f) => f.approved).length;
    const rate = approvals / matches.length;
    return rate >= 0.5 ? 1 + (rate - 0.5) * 0.3 : 1 - (0.5 - rate) * 0.3;
  };

  const weightedSuggestions = activeSuggestions.map((item) => ({
    ...item,
    confidence: typeof item.confidence === 'number' ? Math.max(0.1, Math.min(0.99, Number((item.confidence * getFeedbackMultiplier(item)).toFixed(2)))) : item.confidence,
  }));

  const suggestionBuckets = {
    dashboard: weightedSuggestions.slice(0, 3),
    tasks: weightedSuggestions.filter((item) => item.agent === 'task' || item.type === 'assignment' || item.type === 'reminder').slice(0, 3),
    meals: weightedSuggestions.filter((item) => item.agent === 'meal' || item.type === 'meal_plan').slice(0, 3),
    calendar: weightedSuggestions.filter((item) => item.agent === 'schedule' || item.type === 'conflict' || item.type === 'timeslot').slice(0, 4),
  };

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
    agentSuggestions: suggestionBuckets,
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
    handleUpdateNotificationPrefs,
    handleAddMember, handleUpdateMember, handleRemoveMember,
    myNotifications, unreadNotifsCount, markNotifsAsRead,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};
