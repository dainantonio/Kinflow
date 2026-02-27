import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  Settings, Home, CheckSquare, Calendar as CalendarIcon,
  Gift, X, Plus, Bell, ChevronRight, Clock,
  MapPin, Send, User, Check, Star, Flame,
  Users, BellRing, CreditCard, LogOut,
  Loader2, ArrowRight,
  Layers, Smartphone, Film, Ticket,
  MessageCircle, Trash2, ChevronLeft, UserCircle,
  Award, RefreshCw, Eye, ThumbsUp, ThumbsDown
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged, 
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc
} from 'firebase/firestore';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBaWdluvfxqaW6XRxCkpA6gRvo7g02xsko",
  authDomain: "kinflow-1629b.firebaseapp.com",
  projectId: "kinflow-1629b",
  storageBucket: "kinflow-1629b.appspot.com",
  messagingSenderId: "447158788158",
  appId: "1:447158788158:web:c7034e895ca7ac55f3b16f"
};

// --- FIREBASE INITIALIZATION ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Enable persistent sessions
setPersistence(auth, browserLocalPersistence);

// --- THEME CONFIG ---
const THEME_SWATCHES = [
  { id: 'classic', name: 'Classic', gradient: 'from-indigo-600 to-violet-700' },
  { id: 'ocean', name: 'Ocean', gradient: 'from-blue-600 to-teal-600' },
  { id: 'forest', name: 'Forest', gradient: 'from-emerald-600 to-green-800' },
  { id: 'lavender', name: 'Lavender', gradient: 'from-purple-400 to-indigo-500' },
  { id: 'sunrise', name: 'Sunrise', gradient: 'from-orange-400 to-rose-500' },
  { id: 'sunset', name: 'Sunset', gradient: 'from-rose-500 to-purple-600' },
  { id: 'kids-blue', name: 'Kids Blue', gradient: 'from-sky-400 to-cyan-500' },
  { id: 'kids-sunny', name: 'Kids Sunny', gradient: 'from-amber-400 to-yellow-400' },
];

const EVENT_COLORS = [
  { name: 'Indigo', value: 'bg-indigo-500', text: 'text-indigo-600' },
  { name: 'Emerald', value: 'bg-emerald-500', text: 'text-emerald-600' },
  { name: 'Rose', value: 'bg-rose-500', text: 'text-rose-600' },
  { name: 'Amber', value: 'bg-amber-500', text: 'text-amber-600' },
  { name: 'Sky', value: 'bg-sky-500', text: 'text-sky-600' },
];

// --- CUSTOM STYLES ---
const CustomStyles = () => (
  <style>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes springPress {
      0% { transform: scale(1); }
      40% { transform: scale(0.93); }
      70% { transform: scale(1.04); }
      100% { transform: scale(1); }
    }
    @keyframes bounceIn {
      0% { transform: translateY(12px) scale(0.96); opacity: 0; }
      60% { transform: translateY(-4px) scale(1.02); opacity: 1; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideDown {
      from { transform: translateY(-30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes navBounce {
      0% { transform: translateY(0) scale(1); }
      30% { transform: translateY(-7px) scale(1.18); }
      55% { transform: translateY(2px) scale(0.95); }
      75% { transform: translateY(-3px) scale(1.07); }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes confetti-fall {
      0% { transform: translateY(0px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    @keyframes pulse-slow {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.9; }
    }
    @keyframes countUp {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
    @keyframes popIn {
      0% { transform: scale(0.8); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-bounce-in { animation: bounceIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-fade-in { animation: fadeIn 0.3s ease forwards; }
    .animate-nav-bounce { animation: navBounce 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-float { animation: float 4s ease-in-out infinite; }
    .animate-count-up { animation: countUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
    .spring-press {
      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .spring-press:active { transform: scale(0.95); }
    .pb-safe { padding-bottom: max(env(safe-area-inset-bottom, 16px), 16px); }
  `}</style>
);

// --- CONFETTI COMPONENT ---
const Confetti = ({ show }) => {
  if (!show) return null;
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][i % 5],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, top: '-10px',
          width: p.size, height: p.size, borderRadius: '2px',
          backgroundColor: p.color,
          animation: `confetti-fall 1.2s ease-in forwards ${p.delay}s`
        }} />
      ))}
    </div>
  );
};

// --- TOAST COMPONENT ---
const Toast = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-indigo-600',
  };
  return (
    <div className="fixed top-0 inset-x-0 z-[110] flex justify-center" style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}>
      <div className={`mx-4 ${colors[toast.type] || colors.info} text-white px-5 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-slide-down max-w-sm w-full`}>
        <span className="text-lg">{toast.type === 'success' ? '🎉' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
        <p className="font-bold text-sm flex-1">{toast.message}</p>
        <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white/20 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// --- MODAL COMPONENT ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 pb-3 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate pr-4">{title}</h2>
            <button onClick={onClose} className="spring-press p-2 bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-5 pb-6 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// --- HELPERS ---
const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
};

// --- SIGN IN SCREEN ---
const SignInScreen = ({ onGoogleSignIn, onAnonymousSignIn, isLoading }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-[100px]" />

    <div className="text-center animate-bounce-in relative z-10 flex flex-col items-center">
      <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-[1.5rem] flex items-center justify-center shadow-[0_16px_48px_rgba(0,0,0,0.2)] mb-6 ring-1 ring-white/20">
        <Layers className="w-8 h-8 text-white" strokeWidth={1.5} />
      </div>
      <h1 className="text-5xl font-black text-white mb-2">Kinflow</h1>
      <p className="text-white/90 mb-12 text-lg">AI-powered family command center</p>
      
      <button 
        onClick={onGoogleSignIn}
        disabled={isLoading}
        className="w-full max-w-xs px-6 py-3 bg-white text-indigo-600 font-bold rounded-2xl shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        Sign in with Google
      </button>
      <button 
        onClick={onAnonymousSignIn}
        disabled={isLoading}
        className="w-full max-w-xs px-6 py-3 mt-4 bg-white/20 text-white font-bold rounded-2xl backdrop-blur active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Try Demo (Anonymous)
      </button>
    </div>
  </div>
);

// --- FAMILY SETUP SCREEN ---
const FamilySetupScreen = ({ authUser, onFamilyCreated, onShowJoinFamily, isLoading }) => {
  const [showJoinFamily, setShowJoinFamily] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const handleCreateFamily = async () => {
    try {
      const code = Math.random().toString(36).substring(2, 12).toUpperCase();
      const familyRef = await addDoc(collection(db, 'families'), {
        name: `${authUser.displayName?.split(' ')[0]}'s Family`,
        createdBy: authUser.uid,
        members: [{
          uid: authUser.uid,
          name: authUser.displayName || 'User',
          role: 'parent',
          avatar: '👨'
        }],
        inviteCode: code,
        createdAt: serverTimestamp()
      });

      // Create user doc
      await setDoc(doc(db, 'users', authUser.uid), {
        uid: authUser.uid,
        name: authUser.displayName || 'User',
        email: authUser.email || '',
        photoURL: authUser.photoURL || '',
        role: 'parent',
        familyId: familyRef.id,
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        preferences: {
          theme: 'classic',
          notifications: true
        }
      });

      onFamilyCreated();
    } catch (error) {
      console.error('Failed to create family:', error);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) return;
    setJoinLoading(true);
    try {
      const q = query(collection(db, 'families'), where('inviteCode', '==', inviteCode.toUpperCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert('Invite code not found');
        setJoinLoading(false);
        return;
      }

      const familyDoc = snapshot.docs[0];
      const familyData = familyDoc.data();
      
      // Update family members
      await updateDoc(doc(db, 'families', familyDoc.id), {
        members: arrayUnion({
          uid: authUser.uid,
          name: authUser.displayName || 'User',
          role: 'child',
          avatar: '👧'
        })
      });

      // Create user doc
      await setDoc(doc(db, 'users', authUser.uid), {
        uid: authUser.uid,
        name: authUser.displayName || 'User',
        email: authUser.email || '',
        photoURL: authUser.photoURL || '',
        role: 'child',
        familyId: familyDoc.id,
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        preferences: {
          theme: 'classic',
          notifications: true
        }
      });

      onFamilyCreated();
    } catch (error) {
      console.error('Failed to join family:', error);
      alert('Failed to join family');
    } finally {
      setJoinLoading(false);
    }
  };

  if (showJoinFamily) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xs">
          <button onClick={() => setShowJoinFamily(false)} className="mb-6 flex items-center gap-2 text-indigo-600 font-bold">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <h2 className="text-3xl font-bold mb-6">Join Family</h2>
          <input
            type="text"
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 border border-slate-300 rounded-2xl mb-4 font-bold text-center tracking-widest"
          />
          <button
            onClick={handleJoinFamily}
            disabled={joinLoading || !inviteCode.trim()}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl disabled:opacity-50"
          >
            {joinLoading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : 'Join'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <h2 className="text-3xl font-bold mb-8">Welcome to Kinflow</h2>
      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        <button 
          onClick={handleCreateFamily}
          disabled={isLoading}
          className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Create Family
        </button>
        <button 
          onClick={() => setShowJoinFamily(true)}
          className="px-6 py-4 bg-violet-600 text-white font-bold rounded-2xl"
        >
          Join Family
        </button>
      </div>
    </div>
  );
};

// --- NAV ITEM ---
const NavItem = ({ icon: Icon, label, isActive, isChild, onClick, badge }) => {
  const [bouncing, setBouncing] = useState(false);
  const handleTap = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 500);
    onClick();
  };
  const activeColor = isChild ? 'text-violet-600' : 'text-indigo-600';
  const dotColor = isChild ? 'bg-violet-600' : 'bg-indigo-600';
  return (
    <button
      onClick={handleTap}
      className="flex flex-col items-center justify-center flex-1 px-2 py-2 gap-0.5 relative spring-press group"
      style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px' }}
    >
      <div className={`relative ${bouncing ? 'animate-nav-bounce' : ''} ${isActive ? activeColor : 'text-slate-400'} transition-colors duration-200`}>
        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-amber-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{badge}</span>
        )}
      </div>
      <span className={`text-[9px] font-bold tracking-wide ${isActive ? activeColor : 'text-slate-400'} transition-colors`}>{label}</span>
      {isActive && <div className={`absolute bottom-1 w-1 h-1 ${dotColor} rounded-full`} />}
    </button>
  );
};

// --- HOME SCREEN ---
const HomeScreen = ({ family, currentUser, tasks, onAddTask, onTaskChange, loading }) => {
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const greeting = getGreeting();
  const userRole = currentUser?.role;
  const myTasks = userRole === 'child' ? tasks.filter(t => t.assignedTo === currentUser.uid) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="pb-20 pt-6 px-6">
      <div className="animate-bounce-in">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Good {greeting}! 👋</h1>
        <p className="text-slate-500 text-sm mb-6">{family?.name || 'Welcome to Kinflow'}</p>

        {userRole === 'child' && (
          <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Your Points</p>
                <p className="text-3xl font-black text-indigo-600">{currentUser?.points || 0}</p>
              </div>
              <Star className="w-12 h-12 text-amber-400 animate-float" />
            </div>
          </div>
        )}

        {userRole === 'parent' && (
          <div className="mb-6 p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Approvals</p>
                <p className="text-3xl font-black text-rose-600">{pendingTasks}</p>
              </div>
              <Bell className="w-12 h-12 text-rose-400 animate-float" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            {userRole === 'child' ? 'My Tasks' : 'All Tasks'}
          </h2>
          {userRole === 'parent' && (
            <button onClick={onAddTask} className="p-2 bg-indigo-100 text-indigo-600 rounded-full spring-press">
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {myTasks.length === 0 && userRole === 'child' ? (
            <p className="text-slate-500 text-center py-8">No tasks assigned yet!</p>
          ) : (
            myTasks.map(task => (
              <div key={task.id} className="p-4 bg-white rounded-2xl border border-slate-200 animate-bounce-in">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900">{task.title}</h3>
                  <span className="text-lg font-black text-amber-500">+{task.points}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{task.dueDate}</p>
                <div className="flex gap-2">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => onTaskChange(task.id, 'needs_approval')}
                      className="flex-1 px-3 py-2 bg-violet-100 text-violet-700 rounded-xl font-bold text-sm spring-press"
                    >
                      Mark Done
                    </button>
                  )}
                  {task.status === 'approved' && (
                    <span className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm text-center">
                      ✓ Approved
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- TASKS SCREEN ---
const TasksScreen = ({ tasks, family, currentUser, onAddTask, onTaskChange, onDeleteTask, loading }) => {
  const userRole = currentUser?.role;
  const displayTasks = userRole === 'child' ? tasks.filter(t => t.assignedTo === currentUser.uid) : tasks;
  const pendingTasks = displayTasks.filter(t => t.status === 'pending' || t.status === 'needs_approval');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="pb-20 pt-6 px-6">
      <div className="flex items-center justify-between mb-6 animate-bounce-in">
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        {userRole === 'parent' && (
          <button onClick={onAddTask} className="p-2 bg-indigo-100 text-indigo-600 rounded-full spring-press">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {pendingTasks.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No tasks to do! 🎉</p>
        ) : (
          pendingTasks.map((task, i) => {
            const assignee = family?.members?.find(m => m.uid === task.assignedTo);
            return (
              <div key={task.id} className="p-4 bg-white rounded-2xl border border-slate-200 animate-bounce-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{task.title}</h3>
                    {userRole === 'parent' && (
                      <p className="text-xs text-slate-500">Assigned to {assignee?.name}</p>
                    )}
                  </div>
                  <span className="text-lg font-black text-amber-500">+{task.points}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{task.dueDate}</p>
                <div className="flex gap-2">
                  {userRole === 'parent' && task.status === 'needs_approval' && (
                    <>
                      <button
                        onClick={() => onTaskChange(task.id, 'approved')}
                        className="flex-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm spring-press"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onTaskChange(task.id, 'rejected')}
                        className="flex-1 px-3 py-2 bg-rose-100 text-rose-700 rounded-xl font-bold text-sm spring-press"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {userRole === 'child' && task.status === 'pending' && (
                    <button
                      onClick={() => onTaskChange(task.id, 'needs_approval')}
                      className="flex-1 px-3 py-2 bg-violet-100 text-violet-700 rounded-xl font-bold text-sm spring-press"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- REWARDS SCREEN ---
const RewardsScreen = ({ rewards, currentUser, onClaimReward, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="pb-20 pt-6 px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 animate-bounce-in">Rewards</h1>
      <div className="space-y-3">
        {rewards.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No rewards yet!</p>
        ) : (
          rewards.map((reward, i) => (
            <div key={reward.id} className="p-4 bg-white rounded-2xl border border-slate-200 animate-bounce-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{reward.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900">{reward.title}</h3>
                    <p className="text-sm text-amber-600 font-bold">{reward.cost} points</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onClaimReward(reward.id)}
                disabled={!currentUser || currentUser.points < reward.cost}
                className="w-full px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm spring-press disabled:opacity-50"
              >
                Claim
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- EVENTS SCREEN ---
const EventsScreen = ({ events, family, currentUser, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="pb-20 pt-6 px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 animate-bounce-in">Calendar</h1>
      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No upcoming events!</p>
        ) : (
          events.map((event, i) => (
            <div key={event.id} className="p-4 bg-white rounded-2xl border border-slate-200 animate-bounce-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${event.color || 'bg-indigo-500'}`} />
                <h3 className="font-bold text-slate-900">{event.title}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Calendar as CalendarIcon className="w-4 h-4" />
                  {event.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {event.time}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- ADD TASK MODAL ---
const AddTaskModal = ({ isOpen, onClose, onAdd, family, currentUser }) => {
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(50);
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('Today');
  const [category, setCategory] = useState('chores');
  const [isLoading, setIsLoading] = useState(false);

  const children = family?.members?.filter(m => m.role === 'child') || [];

  const handleSubmit = async () => {
    if (!title.trim() || !assignedTo) return;
    setIsLoading(true);
    try {
      await onAdd({
        title,
        points: parseInt(points),
        assignedTo,
        dueDate,
        category
      });
      setTitle('');
      setPoints(50);
      setAssignedTo('');
      setDueDate('Today');
      setCategory('chores');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-2xl font-bold"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-2xl font-bold"
              min="10"
              max="500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Due Date</label>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-2xl font-bold"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2">Assign to</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-2xl font-bold"
          >
            <option value="">Select child...</option>
            {children.map(child => (
              <option key={child.uid} value={child.uid}>{child.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-2xl font-bold"
          >
            <option value="chores">Chores</option>
            <option value="school">School</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !title.trim() || !assignedTo}
          className="w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Create Task
        </button>
      </div>
    </Modal>
  );
};

// --- SETTINGS SCREEN ---
const SettingsScreen = ({ currentUser, onSignOut, loading }) => {
  return (
    <div className="pb-20 pt-6 px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 animate-bounce-in">Settings</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 animate-bounce-in">
          <p className="text-xs text-slate-600 mb-1">Account</p>
          <p className="text-lg font-bold text-slate-900">{currentUser?.name}</p>
          <p className="text-sm text-slate-500">{currentUser?.email}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 animate-bounce-in">
          <p className="text-xs text-slate-600 mb-1">Role</p>
          <p className="text-lg font-bold text-slate-900 capitalize">{currentUser?.role}</p>
        </div>

        <button
          onClick={onSignOut}
          disabled={loading}
          className="w-full px-4 py-3 bg-rose-600 text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 spring-press"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('home');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User logged in — fetch their profile
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({ uid: user.uid, ...userData });
            setAuthUser(user);
          } else {
            // First-time user — show family setup
            setCurrentUser(null);
            setAuthUser(user);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        // Not logged in
        setCurrentUser(null);
        setAuthUser(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // When user/family changes, subscribe to their data
  useEffect(() => {
    if (!currentUser || !currentUser.familyId) {
      setLoading(false);
      return;
    }

    // Subscribe to family doc
    const unsubscribeFam = onSnapshot(doc(db, 'families', currentUser.familyId), (doc) => {
      if (doc.exists()) setFamily(doc.data());
    });

    // Subscribe to tasks for this family
    const unsubscribeTasks = onSnapshot(
      query(collection(db, 'tasks'), where('familyId', '==', currentUser.familyId)),
      (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Subscribe to events for this family
    const unsubscribeEvents = onSnapshot(
      query(collection(db, 'events'), where('familyId', '==', currentUser.familyId)),
      (snap) => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Subscribe to rewards for this family
    const unsubscribeRewards = onSnapshot(
      query(collection(db, 'rewards'), where('familyId', '==', currentUser.familyId)),
      (snap) => setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    setLoading(false);
    return () => {
      unsubscribeFam();
      unsubscribeTasks();
      unsubscribeEvents();
      unsubscribeRewards();
    };
  }, [currentUser?.familyId]);

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Auth listener will handle the rest
    } catch (error) {
      console.error('Sign in failed:', error);
      setToast({ message: 'Sign in failed', type: 'error' });
    }
  };

  // Handle anonymous sign in
  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously(auth);
      // Auth listener will handle the rest
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFamily(null);
      setTasks([]);
      setRewards([]);
      setEvents([]);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Handle add task
  const handleAddTask = async (taskData) => {
    try {
      await addDoc(collection(db, 'tasks'), {
        familyId: family.id,
        title: taskData.title,
        description: '',
        assignedTo: taskData.assignedTo,
        assignedBy: currentUser.uid,
        points: taskData.points,
        status: 'pending',
        category: taskData.category,
        dueDate: taskData.dueDate,
        createdAt: serverTimestamp(),
        completedAt: null,
        approvedAt: null
      });
      setToast({ message: 'Task created!', type: 'success' });
    } catch (error) {
      console.error('Failed to add task:', error);
      setToast({ message: 'Failed to add task', type: 'error' });
    }
  };

  // Handle task change
  const handleTaskChange = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const updates = { status: newStatus };

      if (newStatus === 'approved') {
        updates.approvedAt = serverTimestamp();
        // Award points to child
        const childRef = doc(db, 'users', task.assignedTo);
        await updateDoc(childRef, {
          points: increment(task.points)
        });
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1200);
        setToast({ message: `🎉 +${task.points} points awarded!`, type: 'success' });
      }

      if (newStatus === 'needs_approval') {
        updates.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, 'tasks', taskId), updates);
    } catch (error) {
      console.error('Failed to update task:', error);
      setToast({ message: 'Failed to update task', type: 'error' });
    }
  };

  // Handle claim reward
  const handleClaimReward = async (rewardId) => {
    try {
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) return;

      // Deduct points from user
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        points: increment(-reward.cost)
      });

      // Add claim record
      await updateDoc(doc(db, 'rewards', rewardId), {
        claimedBy: arrayUnion({
          uid: currentUser.uid,
          claimedAt: serverTimestamp(),
          fulfilledAt: null
        })
      });

      setToast({ message: 'Reward claimed! 🎁', type: 'success' });
    } catch (error) {
      console.error('Failed to claim reward:', error);
      setToast({ message: 'Failed to claim reward', type: 'error' });
    }
  };

  // Show auth loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Show sign in screen
  if (!authUser) {
    return (
      <>
        <CustomStyles />
        <SignInScreen 
          onGoogleSignIn={handleGoogleSignIn}
          onAnonymousSignIn={handleAnonymousSignIn}
          isLoading={authLoading}
        />
      </>
    );
  }

  // Show family setup screen if no family
  if (!currentUser || !currentUser.familyId) {
    return (
      <>
        <CustomStyles />
        <FamilySetupScreen 
          authUser={authUser}
          onFamilyCreated={() => {}}
          onShowJoinFamily={() => {}}
          isLoading={false}
        />
      </>
    );
  }

  // Main app UI
  return (
    <>
      <CustomStyles />
      <div className="min-h-screen bg-white">
        {currentTab === 'home' && (
          <HomeScreen 
            family={family} 
            currentUser={currentUser} 
            tasks={tasks}
            onAddTask={() => setShowAddTask(true)}
            onTaskChange={handleTaskChange}
            loading={loading}
          />
        )}
        {currentTab === 'tasks' && (
          <TasksScreen 
            tasks={tasks}
            family={family}
            currentUser={currentUser}
            onAddTask={() => setShowAddTask(true)}
            onTaskChange={handleTaskChange}
            onDeleteTask={() => {}}
            loading={loading}
          />
        )}
        {currentTab === 'calendar' && (
          <EventsScreen 
            events={events}
            family={family}
            currentUser={currentUser}
            loading={loading}
          />
        )}
        {currentTab === 'rewards' && (
          <RewardsScreen 
            rewards={rewards}
            currentUser={currentUser}
            onClaimReward={handleClaimReward}
            loading={loading}
          />
        )}
        {currentTab === 'settings' && (
          <SettingsScreen 
            currentUser={currentUser}
            onSignOut={handleSignOut}
            loading={loading}
          />
        )}

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe">
          <div className="flex items-center justify-around max-w-2xl mx-auto">
            <NavItem 
              icon={Home} 
              label="Home" 
              isActive={currentTab === 'home'} 
              isChild={currentUser?.role === 'child'}
              onClick={() => setCurrentTab('home')} 
            />
            <NavItem 
              icon={CheckSquare} 
              label="Tasks" 
              isActive={currentTab === 'tasks'} 
              isChild={currentUser?.role === 'child'}
              onClick={() => setCurrentTab('tasks')}
              badge={currentUser?.role === 'parent' ? tasks.filter(t => t.status === 'pending').length : 0}
            />
            <NavItem 
              icon={CalendarIcon} 
              label="Calendar" 
              isActive={currentTab === 'calendar'} 
              isChild={currentUser?.role === 'child'}
              onClick={() => setCurrentTab('calendar')} 
            />
            <NavItem 
              icon={Gift} 
              label="Rewards" 
              isActive={currentTab === 'rewards'} 
              isChild={currentUser?.role === 'child'}
              onClick={() => setCurrentTab('rewards')} 
            />
            <NavItem 
              icon={Settings} 
              label="Settings" 
              isActive={currentTab === 'settings'} 
              isChild={currentUser?.role === 'child'}
              onClick={() => setCurrentTab('settings')} 
            />
          </div>
        </div>
      </div>

      {/* Modals & Components */}
      <AddTaskModal 
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        onAdd={handleAddTask}
        family={family}
        currentUser={currentUser}
      />
      <Confetti show={showConfetti} />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
