import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  DEMO_MODE, auth, db, appId,
  signInWithCustomToken, signInAnonymously, onAuthStateChanged,
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc
} from '../utils/firebase';
import { mockTasks, mockChats, mockEvents, mockMeals, MOCK_USERS } from '../utils/demoData';

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
  const [userPoints, setUserPoints] = useState({ 'Tommy': 0, 'Lily': 0 });
  const [events, setEvents] = useState([]);
  const [meals, setMeals] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Non-Firebase States
  const [groceries, setGroceries] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [lastRedeemed, setLastRedeemed] = useState(null);

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

  // Sync DB
  useEffect(() => {
    if (!firebaseUser) return;
    if (DEMO_MODE) {
      setTasks(mockTasks.map(t => ({...t, id: t.id.toString(), createdAt: Date.now()})));
      setMessages(mockChats.map(c => ({...c, id: c.id.toString(), createdAt: Date.now()})));
      setUserPoints({'Tommy': 45, 'Lily': 30});
      setEvents(mockEvents.map(e => ({...e, id: e.id.toString(), createdAt: Date.now()})));
      setMeals(mockMeals.map(m => ({...m, id: m.id.toString(), createdAt: Date.now()})));
      return;
    }
    const dataPath = 'public';
    const collPath = 'data';

    const tasksRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_tasks');
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      if (snap.empty) mockTasks.forEach(mt => setDoc(doc(tasksRef, mt.id.toString()), { ...mt, createdAt: Date.now() }));
      else setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const msgsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_messages');
    const unsubMsgs = onSnapshot(msgsRef, (snap) => {
      if (snap.empty) mockChats.forEach(mc => setDoc(doc(msgsRef, mc.id.toString()), { ...mc, createdAt: Date.now() }));
      else setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const pointsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_points');
    const unsubPoints = onSnapshot(pointsRef, (snap) => {
      if (snap.empty) {
        setDoc(doc(pointsRef, 'Tommy'), { points: 45 });
        setDoc(doc(pointsRef, 'Lily'), { points: 30 });
      } else {
        let p = { 'Tommy': 0, 'Lily': 0 };
        snap.docs.forEach(d => { p[d.id] = d.data().points; });
        setUserPoints(p);
      }
    }, console.error);

    const eventsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_events');
    const unsubEvents = onSnapshot(eventsRef, (snap) => {
      if (snap.empty) mockEvents.forEach(me => setDoc(doc(eventsRef, me.id.toString()), { ...me, createdAt: Date.now() }));
      else setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const mealsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_meals');
    const unsubMeals = onSnapshot(mealsRef, (snap) => {
      if (snap.empty) mockMeals.forEach(mm => setDoc(doc(mealsRef, mm.id.toString()), { ...mm, createdAt: Date.now() }));
      else setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const notifRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_notifications');
    const unsubNotifs = onSnapshot(notifRef, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, console.error);

    return () => { unsubTasks(); unsubMsgs(); unsubPoints(); unsubEvents(); unsubMeals(); unsubNotifs(); };
  }, [firebaseUser]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

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
    if (DEMO_MODE) { setMessages(prev => [...prev, msgData]); return; }
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_messages', newId), msgData);
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
    groceries, setGroceries,
    showConfetti, isCopilotOpen, setIsCopilotOpen,
    lastRedeemed,
    isParent, isChild, greeting,

    // Actions
    handleLogin, completeOnboarding, triggerConfetti,
    handleAddTask, requestDeleteTask, handleTaskAction,
    handleSendMessage, requestDeleteMessage,
    handleRedeemReward,
    handleAddEvent, requestDeleteEvent,
    handleAddMeal, handleUpdateMeal, requestDeleteMeal,
    handleUpdateProfile,
    myNotifications, unreadNotifsCount, markNotifsAsRead,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};
