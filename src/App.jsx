import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  Settings, Home, CheckSquare, Calendar as CalendarIcon, CalendarDays,
  ChefHat, Gift, Trophy, X, Plus, Bell, ChevronRight, Clock,
  MapPin, Send, User, Check, Utensils, Star, Flame, Zap,
  MoreVertical, Users, BellRing, CreditCard, LogOut,
  ShoppingCart, Loader2, Hourglass, ArrowRight,
  Layers, Wand2, Smartphone, Film, Ticket,
  MessageCircle, Smile, Image as ImageIcon, Camera, Trash2, ChevronLeft, UserCircle, BadgeCheck,
  Crown, Lock, Sparkles, PartyPopper, Medal, TrendingUp
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { taskAgent } from './agents/taskAgent';
import { mealAgent } from './agents/mealAgent';
import { scheduleAgent } from './agents/scheduleAgent';

// --- FIREBASE INITIALIZATION using VITE env vars ---
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const hasEnvConfig = Object.values(envConfig).every(Boolean);
let _fbApp = null, auth = null, db = null;
if (hasEnvConfig) {
  try {
    _fbApp = initializeApp(envConfig);
    auth = getAuth(_fbApp);
    db = getFirestore(_fbApp);
  } catch (e) { console.warn('Firebase init failed:', e); }
}
const appId = 'kinflow-family';

// --- GEMINI API HELPER ---
const fetchWithRetry = async (url, options, retries = 5) => {
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// --- THEME CONTEXT ---
const ThemeContext = createContext({ isChild: false, user: null });

// --- SCROLL REVEAL HOOK ---
const useScrollReveal = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Immediately reveal — scroll reveal is bonus, not gating
    el.classList.add('revealed');
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); observer.disconnect(); } },
      { threshold: 0, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

const RevealCard = ({ children, delay = 0 }) => {
  const ref = useScrollReveal();
  return <div ref={ref} className="scroll-reveal animate-in" style={{transitionDelay:`${delay}ms`}}>{children}</div>;
};

// --- CUSTOM STYLES & KEYFRAMES ---
const CustomStyles = () => (
  <style>
    {`
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
      @keyframes shimmer {
        from { background-position: -200% center; }
        to { background-position: 200% center; }
      }
      @keyframes pulseRing {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2.4); opacity: 0; }
      }
      @keyframes rewardPop {
        0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
        60% { transform: scale(1.15) rotate(4deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes streakFlame {
        0%, 100% { transform: scaleY(1) rotate(-2deg); }
        50% { transform: scaleY(1.15) rotate(2deg); }
      }
      @keyframes xpBar {
        from { width: 0%; }
      }
      .animate-reward-pop { animation: rewardPop 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
      .animate-streak-flame { animation: streakFlame 0.8s ease-in-out infinite; }
      .animate-xp-bar { animation: xpBar 1s cubic-bezier(0.16,1,0.3,1) forwards; }
      @keyframes countUp {
        from { transform: translateY(8px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
      }
      @keyframes popIn {
        0% { transform: scale(0.92); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes confetti-fall {
        0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
      }
      @keyframes pulse-slow {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }

      .animate-bounce-in { animation: bounceIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
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
      .spring-press:active { transform: scale(0.93); }

      .scroll-reveal { opacity: 1; transform: translateY(0); transition: opacity 0.4s ease, transform 0.4s ease; }
      .scroll-reveal.animate-in { opacity: 0; transform: translateY(16px); }
      .scroll-reveal.animate-in.revealed { opacity: 1; transform: translateY(0); }

      .pb-safe { padding-bottom: max(env(safe-area-inset-bottom, 16px), 16px); }

      /* Native-feel scroll */
      .scroll-container {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: contain;
        scroll-behavior: smooth;
      }

      .shimmer-bg {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% auto;
        animation: shimmer 1.4s linear infinite;
      }
    `}
  </style>
);


// --- REUSABLE UI PRIMITIVES ---
const Card = ({ children, className = '', onClick }) => {
  const { isChild } = useContext(ThemeContext);
  const baseClass = isChild
    ? `bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/5 p-5`
    : `bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/5 p-5`;
  return (
    <div
      onClick={onClick}
      className={`${baseClass} transition-all duration-200 ${onClick ? 'cursor-pointer spring-press active:scale-[0.97]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "w-full font-semibold rounded-[1.25rem] py-3.5 px-4 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800",
    secondary: "bg-white/80 backdrop-blur-md text-slate-800 hover:bg-white ring-1 ring-slate-900/10 shadow-sm",
    premium: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]",
    outline: "border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      <div className="relative z-10 flex items-center justify-center gap-2 tracking-wide">{children}</div>
      <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out pointer-events-none rounded-[1.25rem]" style={{ mixBlendMode: 'overlay' }}></div>
    </button>
  );
};

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-slate-100 text-slate-700 ring-1 ring-slate-900/5",
    success: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-900/5",
    warning: "bg-amber-100 text-amber-800 ring-1 ring-amber-900/10",
    premium: "bg-purple-100 text-purple-700 ring-1 ring-purple-900/5",
  };
  return <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold ${variants[variant]} ${className}`}>{children}</span>;
};

const AVATAR_EMOJIS = { mom: '👩🏾', dad: '👨🏾', boy: '👦🏾', girl: '👧🏾' };
const Avatar = ({ user, size = 'md', className = '' }) => {
  if (!user) return null;
  const sizes = { sm: 'w-8 h-8 text-xl', md: 'w-10 h-10 text-2xl', lg: 'w-14 h-14 text-3xl', xl: 'w-20 h-20 text-5xl', xxl: 'w-24 h-24 text-5xl' };
  const emoji = user.avatar ? AVATAR_EMOJIS[user.avatar] : null;
  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br ${user.color} shadow-inner ring-2 ring-white/20 ${sizes[size]} ${className}`}>
      {emoji
        ? <span style={{lineHeight:1}}>{emoji}</span>
        : <span className="text-white font-bold" style={{fontSize:'0.6em'}}>{user.initials}</span>
      }
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, fullHeight = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/75" onClick={onClose} style={{backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)'}}>
      <div
        className="bg-white rounded-t-[2rem] w-full max-w-md flex flex-col shadow-2xl ring-1 ring-black/8 relative animate-slide-up cursor-default"
        style={{
          transformOrigin: 'bottom center',
          maxHeight: '92dvh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-1 shrink-0 flex flex-col items-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full mb-3" />
          <div className="w-full px-5 flex justify-between items-center pb-3 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate pr-4">{title}</h2>
            <button onClick={onClose} className="spring-press p-2 bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200 transition-all shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Scrollable content — always starts at top */}
        <div className="px-5 pt-4 pb-6 overflow-y-auto flex-1" style={{overscrollBehavior:'contain', WebkitOverflowScrolling:'touch'}}>
          {children}
        </div>
      </div>
    </div>
  );
};

const Confetti = ({ active }) => {
  if (!active) return null;
  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-emerald-400', 'bg-amber-400', 'bg-pink-400'];
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex justify-center items-center">
      {[...Array(30)].map((_, i) => (
        <div key={i} className={`absolute w-3 h-3 rounded-sm ${colors[i % colors.length]}`} style={{ left: '50%', top: '50%', animation: `confetti-fall ${0.6 + Math.random() * 0.5}s ease-out forwards`, transformOrigin: 'center', transform: `translate(-50%, -50%)`, margin: `${(Math.random() - 0.5) * 200}px ${(Math.random() - 0.5) * 200}px` }} />
      ))}
    </div>
  );
};

// --- MOCK DATA FOR SEEDING FIREBASE ON FIRST LOAD ---
// MOCK_USERS removed — family members loaded from Firestore
const MOCK_USERS = []; // kept as empty fallback only
const mockTasks = [];
const mockChats = [];
const mockEvents = [];
const mockMeals = [
  { id: 1, day: "Today", meal: "Spaghetti Bolognese", prepTime: "30m", tags: ["Pasta"], ingredients: "1 lb Ground Beef\n1 box Spaghetti\n1 jar Marinara Sauce", instructions: "1. Boil water and cook pasta.\n2. Brown ground beef.\n3. Simmer sauce." }
];
const mockRewards = [];

// --- AUTH & SETUP SCREENS ---

const SplashScreen = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
    <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] animate-pulse-slow" />
    <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize:'28px 28px'}} />

    <div className="animate-bounce-in flex flex-col items-center z-10">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[1.75rem] flex items-center justify-center shadow-[0_20px_60px_rgba(99,102,241,0.5)] mb-6 ring-1 ring-white/10">
        <Layers className="w-10 h-10 text-white" strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl font-bold text-white tracking-wide mb-2">Kinflow</h1>
      <p className="text-white/35 text-sm font-medium">Family, organized.</p>
    </div>

    <div className="absolute bottom-16 flex gap-2">
      {[0,1,2].map(i => (
        <div key={i} className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{animationDelay:`${i*200}ms`}} />
      ))}
    </div>
  </div>
);

const OnboardingFlow = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const advance = (next) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      if (next >= 3) { onComplete(); return; }
      setStep(next);
      setAnimating(false);
    }, 220);
  };

  const slides = [
    {
      bg: 'bg-slate-900',
      dark: true,
      visual: (
        <div className="relative flex items-center justify-center mb-10">
          <div className="absolute w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px]" />
          <div className="absolute w-36 h-36 bg-purple-500/20 rounded-full blur-[40px]" />
          <div className="relative w-28 h-28 bg-white/10 backdrop-blur-sm rounded-[2.5rem] ring-1 ring-white/15 shadow-2xl flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-xl">
              <Layers className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      ),
      heading: (<>Welcome to<br/>Kinflow</>),
      sub: "Your family's AI-powered command center. Organized, connected, and always in sync.",
      cta: 'Get Started'
    },
    {
      bg: 'bg-white',
      dark: false,
      visual: (
        <div className="w-full max-w-xs mb-8">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { icon: <CheckSquare className="w-5 h-5" />, label: 'Chores', sub: 'Earn points', color: 'bg-emerald-100 text-emerald-600' },
              { icon: <CalendarIcon className="w-5 h-5" />, label: 'Schedule', sub: 'Stay ahead', color: 'bg-blue-100 text-blue-600' },
              { icon: <ChefHat className="w-5 h-5" />, label: 'Meals', sub: 'Plan the week', color: 'bg-orange-100 text-orange-500' },
            ].map(f => (
              <div key={f.label} className="flex flex-col items-center gap-2 bg-slate-50 p-4 rounded-[1.5rem] ring-1 ring-slate-100 shadow-sm">
                <div className={`p-2.5 rounded-xl ${f.color}`}>{f.icon}</div>
                <span className="text-xs font-bold text-slate-700 leading-tight text-center">{f.label}</span>
                <span className="text-[9px] font-semibold text-slate-400 text-center leading-tight">{f.sub}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <MessageCircle className="w-5 h-5" />, label: 'Family Chat', sub: 'Stay connected', color: 'bg-pink-100 text-pink-500' },
              { icon: <Wand2 className="w-5 h-5" />, label: 'AI Copilot', sub: 'Smart assist', color: 'bg-purple-100 text-purple-600' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 bg-slate-50 p-4 rounded-[1.5rem] ring-1 ring-slate-100 shadow-sm">
                <div className={`p-2.5 rounded-xl shrink-0 ${f.color}`}>{f.icon}</div>
                <div>
                  <span className="text-xs font-bold text-slate-700 block">{f.label}</span>
                  <span className="text-[9px] font-semibold text-slate-400">{f.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      heading: (<>Built for<br/>the whole family</>),
      sub: 'Parents manage, kids participate, AI assists. One app — everyone included.',
      cta: 'Continue'
    },
    {
      bg: 'bg-gradient-to-br from-indigo-50 via-white to-purple-50',
      dark: false,
      visual: (
        <div className="flex flex-col items-center mb-8 w-full max-w-xs">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-6">
            <Gift className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex gap-3 w-full">
            {[
              { pts: '10 pts', label: 'Dishes', icon: '🍽️' },
              { pts: '25 pts', label: 'Bedroom', icon: '🛏️' },
              { pts: '50 pts', label: 'Lawn', icon: '🌿' },
            ].map(item => (
              <div key={item.label} className="flex-1 bg-white rounded-[1.5rem] p-4 text-center shadow-md shadow-slate-100 ring-1 ring-slate-100">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-xs font-bold text-indigo-600 mb-0.5">{item.pts}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      heading: (<>Make chores<br/>rewarding</>),
      sub: 'Kids earn points for every completed task and redeem them for rewards they actually want.',
      cta: 'Meet My Family'
    }
  ];

  const s = slides[step];

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-500 ${s.bg} relative overflow-hidden`}>
      {step === 0 && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '28px 28px'}} />
        </>
      )}

      {step < 2 && (
        <button onClick={onComplete} className={`absolute top-14 right-6 z-10 text-sm font-bold transition-colors ${s.dark ? 'text-white/35 hover:text-white/60' : 'text-slate-300 hover:text-slate-500'}`}>
          Skip
        </button>
      )}

      <div key={step} className={`flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-4 max-w-md mx-auto w-full transition-opacity duration-200 ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} style={{transition: 'opacity 0.22s ease, transform 0.22s ease'}}>
        {s.visual}
        <h1 className={`text-4xl font-bold tracking-tight text-center leading-tight mb-4 ${s.dark ? 'text-white' : 'text-slate-900'}`}>
          {s.heading}
        </h1>
        <p className={`text-center text-base leading-relaxed font-medium max-w-[280px] ${s.dark ? 'text-white/55' : 'text-slate-500'}`}>
          {s.sub}
        </p>
      </div>

      <div className="px-6 pb-14 pt-4 max-w-md mx-auto w-full">
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? (s.dark ? 'w-8 bg-white' : 'w-8 bg-slate-800') : (s.dark ? 'w-2 bg-white/20' : 'w-2 bg-slate-200')}`} />
          ))}
        </div>
        <button
          onClick={() => advance(step + 1)}
          className={`w-full py-4 rounded-[1.25rem] font-bold text-base transition-all active:scale-[0.97] shadow-lg ${
            step === 0
              ? 'bg-white text-slate-900 shadow-white/10 hover:bg-white/95'
              : step === 2
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.01]'
              : 'bg-slate-900 text-white shadow-slate-900/15'
          }`}
        >
          {s.cta}
        </button>
        {step > 0 && (
          <button onClick={() => advance(step - 1)} className="w-full mt-3 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
            Back
          </button>
        )}
      </div>
    </div>
  );
};


const AuthScreen = () => {
  const [isLoading, setIsLoading] = useState(null); // 'google' | 'apple' | 'demo' | null
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError('');
    setIsLoading('google');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // Use signInWithPopup on all platforms to avoid redirect-related race conditions.
      // signInWithPopup is more reliable and doesn't require handling getRedirectResult().
      await signInWithPopup(auth, provider);
      // onAuthStateChanged handles the screen transition automatically
    } catch (err) {
      const popupIssue = ['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      if (popupIssue.includes(err?.code)) {
        setError('Google sign-in was interrupted. Please try again.');
      } else if (String(err?.message || '').toLowerCase().includes('unauthorized-domain')) {
        setError(`This domain is not authorized in Firebase Auth: ${window.location.hostname}`);
      } else {
        setError('Google sign-in failed. Please try again.');
      }
      setIsLoading(null);
    }
  };

  const handleApple = async () => {
    setError('');
    setIsLoading('apple');
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      // Use signInWithPopup on all platforms to avoid redirect-related race conditions.
      // signInWithPopup is more reliable and doesn't require handling getRedirectResult().
      await signInWithPopup(auth, provider);
      // onAuthStateChanged handles the screen transition automatically
    } catch (err) {
      const popupIssue = ['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      if (popupIssue.includes(err?.code)) {
        setError('Apple sign-in was interrupted. Please try again.');
      } else if (String(err?.message || '').toLowerCase().includes('unauthorized-domain')) {
        setError(`This domain is not authorized in Firebase Auth: ${window.location.hostname}`);
      } else {
        setError('Apple sign-in failed. Please try again.');
      }
      setIsLoading(null);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-500/15 rounded-full blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize:'28px 28px'}} />

      {/* Family avatar trio */}
      <div className="mb-8 flex flex-col items-center animate-bounce-in relative z-10">
        <div className="flex items-center mb-6">
          {[
            {color:'from-rose-400 to-pink-600', emoji:'👩🏾'},
            {color:'from-blue-500 to-indigo-600', emoji:'👨🏾'},
            {color:'from-emerald-400 to-teal-500', emoji:'👦🏾'},
            {color:'from-purple-400 to-violet-500', emoji:'👧🏾'},
          ].map((u,i) => (
            <div key={i} className={`w-12 h-12 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center text-xl shadow-lg ring-2 ring-slate-900`} style={{marginLeft: i>0 ? '-8px': 0, zIndex: 4-i}}>
              <span style={{lineHeight:1}}>{u.emoji}</span>
            </div>
          ))}
        </div>
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_16px_48px_rgba(99,102,241,0.45)] mb-5 ring-1 ring-white/10">
          <Layers className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-wide mb-1">Kinflow</h1>
        <p className="text-white/45 text-sm font-medium">Your family, in sync.</p>
      </div>

      <div className="w-full max-w-sm relative z-10 animate-bounce-in space-y-3" style={{animationDelay:'0.1s'}}>
        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={!!isLoading}
          className="spring-press w-full py-4 px-5 rounded-[1.25rem] font-semibold text-[15px] bg-white text-slate-800 shadow-lg hover:bg-white/95 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
        >
          {isLoading === 'google' ? <Loader2 className="w-5 h-5 animate-spin text-slate-500" /> : (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Apple */}
        <button
          onClick={handleApple}
          disabled={!!isLoading}
          className="spring-press w-full py-4 px-5 rounded-[1.25rem] font-semibold text-[15px] bg-black text-white border border-white/10 shadow-lg hover:bg-black/80 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
        >
          {isLoading === 'apple' ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          )}
          Continue with Apple
        </button>

        {error && (
          <div className="text-red-400 text-xs text-center font-medium px-2 py-2 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>
        )}

        <div className="pt-2 text-center">
        </div>
      </div>

      <p className="mt-10 text-white/20 text-[10px] font-medium text-center relative z-10 px-8">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};
const ProfileSelectorScreen = ({ onLogin, users, onLogout, onAddMember, firebaseUser }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Child');
  const [newAvatar, setNewAvatar] = useState('👧🏾');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await onAddMember({ name: newName.trim(), role: newRole, avatar: newAvatar });
    setNewName('');
    setNewRole('Child');
    setNewAvatar('👧🏾');
    setSaving(false);
    setShowAddModal(false);
  };

  return (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-500/15 rounded-full blur-[100px]" />
    <div className="relative z-10 w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[1.75rem] flex items-center justify-center mx-auto mb-4 shadow-2xl">
          <span className="text-3xl">🏠</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Who's home?</h1>
        <p className="text-slate-400 mt-2 text-sm">Choose your profile to continue</p>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-400 mb-4">No family members yet.</p>
          <p className="text-slate-500 text-sm">Add yourself to get started!</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {users.map(u => (
            <button key={u.id} onClick={() => onLogin(u)}
              className="w-full flex items-center gap-4 p-4 rounded-[1.75rem] bg-white/10 hover:bg-white/20 active:scale-[0.98] transition-all text-left">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${u.color || 'from-indigo-400 to-violet-500'} flex items-center justify-center text-2xl shadow-lg`}>
                {u.photoURL ? <img src={u.photoURL} className="w-full h-full rounded-2xl object-cover" alt={u.name}/> : (u.avatar?.length > 2 ? u.initials : u.avatar || u.initials)}
              </div>
              <div>
                <div className="font-bold text-lg leading-tight">{u.name}</div>
                <div className="text-xs text-slate-400 font-medium">{u.role}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 ml-auto"/>
            </button>
          ))}
        </div>
      )}

      <button onClick={() => setShowAddModal(true)}
        className="w-full py-3.5 rounded-[1.75rem] border-2 border-dashed border-white/20 text-slate-400 hover:border-white/40 hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-semibold mb-6">
        <Plus className="w-4 h-4"/>Add Family Member
      </button>

      <button onClick={onLogout} className="w-full text-center text-slate-500 text-sm hover:text-slate-300 transition-colors py-2">
        Sign out
      </button>
    </div>

    {showAddModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
        <div className="bg-slate-800 rounded-[1.75rem] p-6 w-full max-w-sm space-y-4">
          <h3 className="text-xl font-bold text-white text-center">Add Family Member</h3>
          
          <div className="text-center text-4xl py-2">{newAvatar}</div>
          
          <div className="grid grid-cols-5 gap-2">
            {['👩🏾','👨🏾','👧🏾','👦🏾','👩🏿','👨🏿','👧🏿','👦🏿','👩🏽','👨🏽'].map(em => (
              <button key={em} onClick={() => setNewAvatar(em)}
                className={`text-2xl p-2 rounded-xl transition-all ${newAvatar === em ? 'bg-indigo-500 scale-110' : 'bg-white/10 hover:bg-white/20'}`}>
                {em}
              </button>
            ))}
          </div>

          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Name (e.g. Marcus)" maxLength={20}
            className="w-full bg-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 text-base"/>

          <div className="flex gap-2">
            {['Parent','Child'].map(r => (
              <button key={r} onClick={() => setNewRole(r)}
                className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${newRole === r ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                {r}
              </button>
            ))}
          </div>

          <button onClick={handleAdd} disabled={!newName.trim() || saving}
            className="w-full py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 font-bold text-white transition-all">
            {saving ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    )}
  </div>
  );
};

// --- MAIN FEATURE SUB-VIEWS ---

const AgentSuggestionCard = ({ icon = '🤖', title, subtitle, reasoning, confidence, source, onApprove, onDismiss, approveLabel = 'Approve' }) => {
  const [expanded, setExpanded] = useState(false);
  const sourceLabel = source === 'automation' ? '⚙️ Auto' : source === 'task' ? '📋 Tasks' : source === 'meal' ? '🍽️ Meals' : source === 'schedule' ? '📅 Schedule' : '🤖 AI';
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-indigo-100">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-slate-800 leading-tight">{title}</p>
            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">{sourceLabel}</span>
          </div>
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
          <div className="flex items-center gap-3 mt-1.5">
            {typeof confidence === 'number' && (
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{width:`${Math.round(confidence*100)}%`}} />
                </div>
                <span className="text-[10px] font-bold text-indigo-500">{Math.round(confidence * 100)}% conf</span>
              </div>
            )}
            {reasoning && (
              <button onClick={() => setExpanded(e => !e)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
                {expanded ? 'less' : 'why?'}
              </button>
            )}
          </div>
          {expanded && reasoning && (
            <div className="mt-2 p-2.5 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{reasoning}</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onApprove} className="spring-press px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">{approveLabel}</button>
        <button onClick={onDismiss} className="spring-press px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">Dismiss</button>
      </div>
    </div>
  );
};

const ChatView = ({ messages, onSend, onDelete, allUsers = [], onApproveSuggestion, onDismissSuggestion }) => {
  const { isChild, user } = useContext(ThemeContext);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const isParent = user?.role === 'Parent';

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    onSend(text);
    setInput('');
  };

  return (
    <div className="flex flex-col animate-bounce-in h-full" style={{minHeight:'380px'}}>
      {/* Chat header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Family Chat</h2>
          <div className="flex items-center gap-1 mt-1">
            {(allUsers||[]).slice(0,4).map((u,i) => (
              <div key={u.id} className="relative" style={{marginLeft: i > 0 ? '-6px' : 0, zIndex: 4-i}}>
                <Avatar user={u} size="sm" className="ring-2 ring-white" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-1 ring-white" />
              </div>
            ))}
            <span className="text-xs font-bold text-slate-400 ml-2">{(allUsers||[]).length} online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === user.id;
            const sender = (allUsers||[]).find(u => u.id === msg.senderId) || { name: msg.senderName || 'Unknown', initials: '?', color: 'from-slate-400 to-slate-500' };
            return (
              <div key={msg.id} className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && <Avatar user={sender} size="sm" className="shrink-0 mb-4 ring-2 ring-white shadow-sm" />}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[78%]`}>
                  {!isMe && <span className="text-[10px] font-bold text-slate-400 ml-2 mb-1">{sender?.name}</span>}
                  <div className={`px-4 py-2.5 text-sm font-medium leading-relaxed shadow-sm
                    ${isMe
                      ? 'bg-slate-900 text-white rounded-3xl rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-3xl rounded-bl-md ring-1 ring-black/5'}`}>
                    {msg.text}
                  </div>
                  {Array.isArray(msg.suggestions) && msg.suggestions.length > 0 && (
                    <div className="mt-2 space-y-2 w-full">
                      {msg.suggestions.slice(0, 2).map((suggestion) => (
                        <AgentSuggestionCard
                          key={suggestion.id}
                          icon={suggestion.icon || '🤖'}
                          title={suggestion.title}
                          subtitle={suggestion.subtitle}
                          reasoning={suggestion.reasoning}
                          source={suggestion.source}
                          confidence={suggestion.confidence}
                          onApprove={() => onApproveSuggestion?.(suggestion)}
                          onDismiss={() => onDismissSuggestion?.(suggestion.id)}
                        />
                      ))}
                    </div>
                  )}
                  <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {isMe && (
                      <button onClick={() => onDelete(msg.id)} className="text-slate-300 hover:text-rose-500 p-0.5 rounded transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <span className="text-[9px] font-bold text-slate-300">{msg.time}</span>
                    {!isMe && isParent && (
                      <button onClick={() => onDelete(msg.id)} className="text-slate-300 hover:text-rose-500 p-0.5 rounded transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies for kids */}
        {isChild && (
          <div className="px-3 pt-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {['👍', '❤️', 'Done!', 'Need help', 'Snack time?'].map(reply => (
                <button key={reply} onClick={() => handleSend(reply)} className="spring-press whitespace-nowrap bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors">
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-slate-100 p-3 flex items-center gap-2 shrink-0 bg-slate-50/50">
          {!isChild && <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><ImageIcon className="w-4 h-4" /></button>}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={"Message family..."}
            className="flex-1 bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all font-medium rounded-2xl pl-4 pr-4 py-2.5 text-sm"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className={`spring-press p-2.5 text-white rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center ${'bg-slate-900'}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// CHILD MISSION HOME — game-like quest screen for kids
const ChildHome = ({ tasks, events, points, activeUser, onNavigate }) => {
  const myTasks = tasks.filter(t => (t.assignee === activeUser?.name || t.assignee === 'Anyone') && t.status === 'open');
  const pendingTasks = tasks.filter(t => t.assignee === activeUser?.name && t.status === 'pending');
  const doneTasks = tasks.filter(t => t.assignee === activeUser?.name && t.status === 'approved');
  const levelInfo = getLevelInfo(points);
  const totalMissions = myTasks.length + pendingTasks.length + doneTasks.length;
  const doneCount = doneTasks.length;
  const progressPct = totalMissions > 0 ? Math.round((doneCount / totalMissions) * 100) : 0;
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? '🌅 Morning' : currentHour < 18 ? '☀️ Afternoon' : '🌙 Evening';

  return (
    <div className="space-y-4 animate-bounce-in">
      {/* HERO CARD */}
      <div className="relative overflow-hidden rounded-[2rem] p-5" style={{background:'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)'}}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-start justify-between mb-4">
          <div>
            <p className="text-sky-300/70 text-[10px] font-bold uppercase tracking-widest">{timeGreeting}</p>
            <h1 className="text-2xl font-black text-white mt-0.5">{activeUser?.name}! 👋</h1>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${levelInfo.color} shadow-md mt-2`}>
              <Crown className="w-3 h-3 text-white" />
              <span className="text-white text-[10px] font-black uppercase tracking-wider">{levelInfo.name}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-white">{points}</p>
            <p className="text-sky-300/60 text-[10px] font-black uppercase">points</p>
          </div>
        </div>
        {/* Daily progress bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sky-200/60 text-[10px] font-bold uppercase tracking-wider">Today's Progress</span>
            <span className="text-sky-200/70 text-[10px] font-black">{doneCount}/{totalMissions} done</span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-300 to-cyan-400 rounded-full transition-all duration-700" style={{width:`${progressPct}%`}} />
          </div>
        </div>
      </div>

      {/* MISSIONS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            {myTasks.length > 0 ? `⚡ ${myTasks.length} Mission${myTasks.length > 1 ? 's' : ''} Active` : '✅ All Clear!'}
          </p>
          <button onClick={() => onNavigate('tasks')} className="text-xs font-bold text-sky-500">See all →</button>
        </div>

        {myTasks.length === 0 && pendingTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center ring-1 ring-black/5">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-black text-slate-800">All missions complete!</p>
            <p className="text-slate-400 text-sm mt-1">You're crushing it today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.length > 0 && (
              <div onClick={() => onNavigate('tasks')} className="spring-press bg-amber-50 rounded-3xl p-4 ring-2 ring-amber-200 cursor-pointer flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Hourglass className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-amber-900 text-sm">{pendingTasks.length} waiting for approval</p>
                  <p className="text-amber-600 text-xs font-semibold">Parent review in progress...</p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </div>
            )}
            {myTasks.slice(0, 3).map((task, idx) => (
              <div key={task.id} onClick={() => onNavigate('tasks')}
                className="spring-press bg-white rounded-3xl p-4 ring-1 ring-black/5 shadow-sm flex items-center gap-4 cursor-pointer"
                style={{animationDelay:`${idx*60}ms`}}>
                <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center text-xl shrink-0">
                  {['🧹','🍽️','🛏️','🐕','🌿','📚','🗑️'][idx % 7]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{task.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-amber-600">{task.points || 10} pts</span>
                  </div>
                </div>
                <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
            {myTasks.length > 3 && (
              <button onClick={() => onNavigate('tasks')} className="spring-press w-full py-3 rounded-3xl bg-slate-100 text-slate-500 font-bold text-sm">
                +{myTasks.length - 3} more missions →
              </button>
            )}
          </div>
        )}
      </div>

      {/* NEXT REWARD TEASER */}
      <div onClick={() => onNavigate('rewards')} className="spring-press cursor-pointer bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl p-4 shadow-lg shadow-amber-400/30 flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">🎁</div>
        <div className="flex-1">
          <p className="text-white font-black text-sm">Rewards Shop</p>
          <p className="text-white/70 text-xs font-semibold">{points} pts available to spend</p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
      </div>

      {/* UPCOMING EVENTS for kids — only genuinely future events */}
      {(() => {
        const now = new Date();
        const upcoming = (events || []).filter(ev => {
          if (!ev.date) return false; // no date = don't guess
          // Parse actual datetime (same logic as parseEventDateTime)
          if (ev.time) {
            const t = ev.time.match(/(\d+):?(\d*)\s*(am|pm)?/i);
            if (t) {
              let h = parseInt(t[1]), m = parseInt(t[2] || '0');
              const ampm = (t[3] || '').toLowerCase();
              if (ampm === 'pm' && h < 12) h += 12;
              if (ampm === 'am' && h === 12) h = 0;
              const dt = new Date(ev.date + 'T00:00:00');
              dt.setHours(h, m, 0, 0);
              return dt >= now;
            }
          }
          // No parseable time — only show if it's a future date (not today already ended)
          return new Date(ev.date + 'T23:59:59') > now && new Date(ev.date + 'T00:00:00') >= new Date(now.toDateString());
        })
        .sort((a, b) => new Date(a.date + 'T12:00:00') - new Date(b.date + 'T12:00:00'))
        .slice(0, 2);

        if (upcoming.length === 0) return null;
        return (
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">📅 Coming Up</p>
            <div className="space-y-2">
              {upcoming.map((event) => (
                <div key={event.id} className="bg-white rounded-2xl p-4 ring-1 ring-black/5 flex items-center gap-3">
                  <div className={`w-1 h-10 rounded-full shrink-0 ${event.color || 'bg-indigo-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{event.title}</p>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">
                      {event.time}{event.location ? ` · ${event.location}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const Dashboard = ({ tasks, events, points, activeUser, isParent, onNavigate, onOpenCopilot, allUsers = [], suggestions = [], onApproveSuggestion, onDismissSuggestion }) => {
  const { isChild } = useContext(ThemeContext);

  // Kids get their own dedicated home screen
  if (isChild) return <ChildHome tasks={tasks} events={events} points={points} activeUser={activeUser} onNavigate={onNavigate} />;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const visibleTasks = tasks;
  const openTasks = visibleTasks.filter(t => t.status === 'open').length;
  const pendingApproval = tasks.filter(t => t.status === 'pending').length;
  const copilotPrompt = pendingApproval > 0
    ? `${pendingApproval} task${pendingApproval > 1 ? 's' : ''} pending approval — what should I focus on today?`
    : openTasks > 0
    ? `There are ${openTasks} open chores — what should I focus on today?`
    : `What should I focus on today?`;

  return (
    <div className="space-y-5 animate-bounce-in">
      {/* GREETING HERO */}
      <RevealCard delay={0}>
        <div className="relative overflow-hidden rounded-3xl p-5" style={{background:'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)'}}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <p className="text-indigo-200/70 text-[10px] font-bold uppercase tracking-widest mb-1">{greeting}</p>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">{activeUser?.name} 👋</h1>
            <p className="text-white/40 text-xs font-medium mt-1 mb-4">
              {`${openTasks} chores open · ${pendingApproval} need review`}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl ring-1 ring-white/15">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="text-white font-bold text-sm">{points} family pts</span>
              </div>
              {/* Copilot quick-fire button inside hero */}
              {onOpenCopilot && (
                <button
                  onClick={() => onOpenCopilot(copilotPrompt)}
                  className="spring-press inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl ring-1 ring-white/15 hover:bg-white/20 transition-colors"
                >
                  <Wand2 className="w-4 h-4 text-violet-300" />
                  <span className="text-white/80 font-bold text-sm">Ask Copilot</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </RevealCard>

      {/* COPILOT FOCUS CARD — persistent entry point */}
      {onOpenCopilot && (
        <RevealCard delay={20}>
          <button
            onClick={() => onOpenCopilot(copilotPrompt)}
            className="spring-press w-full text-left bg-gradient-to-r from-indigo-50 to-violet-50 rounded-3xl p-4 ring-1 ring-indigo-100 flex items-center gap-4 hover:ring-indigo-300 transition-all"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-800 text-sm">What should I focus on today?</p>
              <p className="text-indigo-500 text-xs font-semibold mt-0.5">Tap to ask your family AI →</p>
            </div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
          </button>
        </RevealCard>
      )}

      {suggestions.length > 0 && (
        <RevealCard delay={40}>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((suggestion) => (
              <AgentSuggestionCard
                key={suggestion.id}
                icon={suggestion.icon || '🤖'}
                title={suggestion.title}
                subtitle={suggestion.subtitle}
                reasoning={suggestion.reasoning}
                confidence={suggestion.confidence}
                onApprove={() => onApproveSuggestion?.(suggestion)}
                onDismiss={() => onDismissSuggestion?.(suggestion.id)}
              />
            ))}
          </div>
        </RevealCard>
      )}

      {/* PENDING APPROVAL ALERT */}
      {pendingApproval > 0 && (
        <RevealCard delay={60}>
          <div onClick={() => onNavigate('tasks')} className="spring-press flex items-center gap-4 bg-amber-400 rounded-3xl p-4 shadow-lg shadow-amber-400/25 cursor-pointer">
            <div className="w-10 h-10 bg-white/25 rounded-2xl flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm leading-tight">{pendingApproval} task{pendingApproval>1?'s':''} need approval</p>
              <p className="text-amber-900/60 text-xs font-semibold mt-0.5">Tap to review →</p>
            </div>
          </div>
        </RevealCard>
      )}

      {/* QUICK STATS GRID */}
      <RevealCard delay={80}>
        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => onNavigate('tasks')} className="spring-press rounded-3xl p-5 cursor-pointer relative overflow-hidden bg-slate-900 shadow-lg shadow-slate-900/15">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-4 translate-x-4" />
            <CheckSquare className="w-5 h-5 mb-3 text-white/50" strokeWidth={2} />
            <p className="text-4xl font-bold text-white tracking-tight">{openTasks}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-1">Chores open</p>
          </div>
          <div onClick={() => onNavigate('rewards')} className="spring-press bg-white rounded-3xl p-5 cursor-pointer shadow-sm ring-1 ring-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-full -translate-y-4 translate-x-4" />
            <Gift className="w-5 h-5 text-amber-500 mb-3" strokeWidth={2} />
            <p className="text-4xl font-bold text-slate-900 tracking-tight">{points}</p>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">Family pts</p>
          </div>
        </div>
      </RevealCard>

      {/* UPCOMING EVENTS */}
      <RevealCard delay={120}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Up Next</h3>
            <button onClick={() => onNavigate('calendar')} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors">View all</button>
          </div>
          <div className="space-y-2">
            {(() => {
              const now = new Date();
              const upcoming = (events || [])
                .filter(ev => {
                  if (!ev.date) return true;
                  const base = new Date(ev.date + 'T23:59:59');
                  if (ev.time) {
                    const t = ev.time.match(/(\d+):(\d+)\s*(am|pm)?/i);
                    if (t) {
                      let h = parseInt(t[1]), m = parseInt(t[2]);
                      const ampm = (t[3] || '').toLowerCase();
                      if (ampm === 'pm' && h < 12) h += 12;
                      if (ampm === 'am' && h === 12) h = 0;
                      const dt = new Date(ev.date + 'T00:00:00');
                      dt.setHours(h, m, 0, 0);
                      return dt >= now;
                    }
                  }
                  return base >= now;
                })
                .sort((a, b) => new Date(a.date + 'T12:00:00') - new Date(b.date + 'T12:00:00'))
                .slice(0, 2);
              if (upcoming.length === 0) return (
                <div className="bg-slate-50 rounded-2xl p-5 text-center">
                  <p className="text-slate-400 text-sm font-medium">No upcoming events 🎉</p>
                </div>
              );
              return upcoming.map((event, i) => (
                <div key={event.id} className="spring-press bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5 flex items-center gap-4" style={{animationDelay:`${i*80}ms`}}>
                  <div className={`w-1 h-10 rounded-full shrink-0 ${event.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-sm truncate">{event.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/>{event.time}</span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3"/>{event.location}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
              ));
            })()}
          </div>
        </div>
      </RevealCard>
    </div>
  );
};

const TasksView = ({ tasks, onAction, onAdd, onDelete, activeUser, isParent, allUsers = [], suggestions = [], onApproveSuggestion, onDismissSuggestion }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [taskPoints, setTaskPoints] = useState(10);
  const [requiresPhoto, setRequiresPhoto] = useState(false);

  const { isChild } = useContext(ThemeContext);

  const [activeTaskForPhoto, setActiveTaskForPhoto] = useState(null); 
  const [mockPhotoCaptured, setMockPhotoCaptured] = useState(null);
  const [activeTaskForReview, setActiveTaskForReview] = useState(null); 
  
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Swipe-to-delete (parents only)
  const [swipedTaskId, setSwipedTaskId] = useState(null);
  const touchStartXTask = useRef(null);

  const handleSwipeDeleteTask = (task) => {
    setSwipedTaskId(null);
    onDelete(task.id);
  };

  const visibleTasks = isParent ? tasks : tasks.filter(t => t.assignee === activeUser?.name || t.assignee === 'Anyone');

  const handleSubmitNewTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, assignee, points: parseInt(taskPoints), requiresPhoto });
    setTitle('');
    setRequiresPhoto(false);
    setIsModalOpen(false);
  };

  const handleTaskClick = (task) => {
    if (isParent) {
      if (task.status === 'pending') {
        if (task.requiresPhoto && task.photoUrl) setActiveTaskForReview(task);
        else onAction(task.id, 'approve');
      } else {
        onAction(task.id, 'toggle_simple');
      }
    } else {
      if (task.status === 'open' && task.requiresPhoto) {
        setActiveTaskForPhoto(task);
        setMockPhotoCaptured(null);
      } else {
        onAction(task.id, 'toggle_simple');
      }
    }
  };

  const handleCaptureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; 
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setMockPhotoCaptured(dataUrl);
        setIsUploading(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPhoto = () => {
    onAction(activeTaskForPhoto.id, 'submit_with_photo', { photoUrl: mockPhotoCaptured });
    setActiveTaskForPhoto(null);
  };

  return (
    <div className="space-y-5 animate-bounce-in">
      <RevealCard delay={0}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{isParent ? 'Family Tasks' : 'My Chores'}</h2>
            <p className="text-slate-400 font-medium text-sm mt-0.5">Check off to earn points!</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{visibleTasks.filter(t=>t.status==='open').length} open</span>
            {isParent && (
              <button onClick={() => setIsModalOpen(true)} className="spring-press w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-900/20">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </RevealCard>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <AgentSuggestionCard
              key={suggestion.id}
              icon={suggestion.icon || '✅'}
              title={suggestion.title}
              subtitle={suggestion.subtitle}
              reasoning={suggestion.reasoning}
              source={suggestion.source}
              confidence={suggestion.confidence}
              onApprove={() => onApproveSuggestion?.(suggestion)}
              onDismiss={() => onDismissSuggestion?.(suggestion.id)}
            />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {visibleTasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl ring-1 ring-black/5">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-slate-400 font-medium text-sm">No tasks right now!</p>
          </div>
        )}
        {visibleTasks.map((task, idx) => {
          const isApproved = task.status === 'approved';
          const isPending = task.status === 'pending';
          const isSwiped = swipedTaskId === task.id;

          return (
            <RevealCard key={task.id} delay={idx * 60}>
              <div className="relative overflow-hidden rounded-3xl">
                {/* Swipe-to-delete zone (parent only) */}
                {isParent && (
                  <div
                    className="absolute right-0 top-0 h-full w-20 bg-rose-500 flex items-center justify-center rounded-r-3xl cursor-pointer select-none"
                    onClick={(e) => { e.stopPropagation(); handleSwipeDeleteTask(task); }}
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                )}
                {/* Card */}
                <div
                  style={{ transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)', transition: 'transform 0.28s cubic-bezier(0.25,1,0.5,1)' }}
                  onTouchStart={(e) => {
                    if (swipedTaskId !== null && swipedTaskId !== task.id) setSwipedTaskId(null);
                    touchStartXTask.current = e.touches[0].clientX;
                  }}
                  onTouchMove={(e) => {
                    if (touchStartXTask.current === null) return;
                    const dx = touchStartXTask.current - e.touches[0].clientX;
                    if (isParent && dx > 55) setSwipedTaskId(task.id);
                    else if (dx < -10) setSwipedTaskId(null);
                  }}
                  onTouchEnd={() => { touchStartXTask.current = null; }}
                  onClick={() => {
                    if (isSwiped) { setSwipedTaskId(null); return; }
                    handleTaskClick(task);
                  }}
                  className={`bg-white rounded-3xl p-4 shadow-sm ring-1 flex items-center gap-3 cursor-pointer transition-colors
                    ${isApproved ? 'opacity-55 ring-black/5' : isPending ? 'ring-amber-200 bg-amber-50/30' : 'ring-black/5'}`}
                >
                  {/* Left accent */}
                  <div className={`w-1 h-12 rounded-full shrink-0 ${isApproved ? 'bg-emerald-400' : isPending ? 'bg-amber-400' : 'bg-slate-200'}`} />

                  {/* Status circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                    ${isApproved ? 'bg-emerald-500 border-emerald-500' : isPending ? 'bg-amber-400 border-amber-400' : 'border-dashed border-slate-300'}`}>
                    {isApproved && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                    {isPending && <Hourglass className="w-3.5 h-3.5 text-white" style={{animationDuration:'3s'}} />}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm leading-tight ${isApproved ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3"/>{task.assignee}</span>
                      {task.requiresPhoto && <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Camera className="w-3 h-3"/>Photo</span>}
                      {isPending && isChild && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Waiting...</span>}
                    </div>
                  </div>

                  {/* Points + pending badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending && isParent && <span className="text-[9px] font-bold bg-amber-400 text-white px-2.5 py-1 rounded-full animate-pulse">Review</span>}
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isApproved ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'}`}>+{task.points}</span>
                  </div>
                </div>
              </div>
            </RevealCard>
          )
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Task">
        <form onSubmit={handleSubmitNewTask} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Task Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-slate-800 font-medium transition-all" placeholder="e.g., Clean the garage" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assignee</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium">
                <option value="">Anyone</option>
                {(allUsers||[]).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Points</label>
              <select value={taskPoints} onChange={e => setTaskPoints(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium">
                <option value="5">5 pts</option><option value="10">10 pts</option><option value="15">15 pts</option><option value="20">20 pts</option><option value="50">50 pts</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
            <div>
              <h4 className="font-bold text-sm text-slate-700">Require Photo Proof</h4>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Child must snap a photo to finish.</p>
            </div>
            <div onClick={() => setRequiresPhoto(!requiresPhoto)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${requiresPhoto ? 'bg-indigo-500' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${requiresPhoto ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </div>

          <button type="submit" className="spring-press w-full py-4 rounded-2xl font-bold text-base bg-slate-900 text-white shadow-md shadow-slate-900/20 mt-2">Add Task</button>
        </form>
      </Modal>

      <Modal isOpen={!!activeTaskForPhoto} onClose={() => setActiveTaskForPhoto(null)} title="Submit Proof">
        {!mockPhotoCaptured ? (
          <div className="space-y-4">
            <div className="h-44 bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center border-4 border-dashed border-slate-300 mx-auto w-full max-w-sm transition-all">
              <Camera className="w-12 h-12 text-slate-400 mb-2" />
              <p className="font-bold text-sm text-slate-500">Frame your work clearly!</p>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />
            
            <Button variant="primary" onClick={handleCaptureClick} disabled={isUploading}>
              {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Snap Photo"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-48 bg-slate-900 rounded-[2rem] overflow-hidden relative shadow-inner mx-auto w-full max-w-sm">
              <img src={mockPhotoCaptured} className="w-full h-full object-cover" alt="Captured proof" />
              <div className="absolute top-3 right-3 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                <Check className="w-4 h-4" strokeWidth={3} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setMockPhotoCaptured(null)}>Retake</Button>
              <Button variant="primary" className="flex-1" onClick={handleSubmitPhoto}>Submit</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!activeTaskForReview} onClose={() => setActiveTaskForReview(null)} title="Review Work">
        {activeTaskForReview && (
          <div className="space-y-4">
            <p className="font-medium text-sm text-slate-600 text-center">
              {activeTaskForReview.assignee} submitted proof for <span className="font-bold text-slate-900">"{activeTaskForReview.title}"</span>
            </p>
            <div className="h-48 bg-slate-900 rounded-[1.5rem] overflow-hidden shadow-inner mx-auto w-full max-w-sm">
              <img src={activeTaskForReview.photoUrl} className="w-full h-full object-cover" alt="Submitted proof" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 !border-rose-200 !text-rose-600 hover:!bg-rose-50" onClick={() => { onAction(activeTaskForReview.id, 'reject'); setActiveTaskForReview(null); }}>Needs Work</Button>
              <Button variant="primary" className="flex-1 !bg-emerald-500 hover:!bg-emerald-600 shadow-emerald-500/30" onClick={() => { onAction(activeTaskForReview.id, 'approve'); setActiveTaskForReview(null); }}>Approve</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const CalendarView = ({ events, onAdd, onDelete, isParent, suggestions = [], onApproveSuggestion, onDismissSuggestion }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [swipedEventId, setSwipedEventId] = useState(null);
  const [undoEvent, setUndoEvent] = useState(null);
  const listRef = useRef(null);

  const today = new Date();

  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const calendarDays = React.useMemo(() => {
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [monthDate]);

  const isSameDate = (a, b) =>
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const parseEventDateTime = (event) => {
    if (!event.date) return new Date();
    // Try to parse the free-text time field (e.g. "2:00 PM", "14:30", "9am")
    if (event.time) {
      const t = event.time.match(/(\d+):?(\d*)\s*(am|pm)?/i);
      if (t) {
        let h = parseInt(t[1]), m = parseInt(t[2] || '0');
        const ampm = (t[3] || '').toLowerCase();
        if (ampm === 'pm' && h < 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;
        const dt = new Date(event.date + 'T00:00:00');
        dt.setHours(h, m, 0, 0);
        return dt;
      }
    }
    // No parseable time — treat as end of day so the event stays visible all day
    return new Date(event.date + 'T23:59:59');
  };

  const parseEventDate = (event) => {
    if (event.date) return new Date(event.date + 'T12:00:00');
    return new Date();
  };

  const eventsByDate = React.useMemo(() => {
    const map = {};
    (events || []).forEach((ev) => {
      const d = parseEventDate(ev);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const eventsForDay = (d) => {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    return eventsByDate[key] || [];
  };

  const selectedDayEvents = React.useMemo(() =>
    (events || []).filter((ev) => isSameDate(parseEventDate(ev), selectedDay)),
    [events, selectedDay]
  );

  const allSortedEvents = React.useMemo(() => {
    const now = new Date();
    const upcoming = [...(events || [])].filter(e => parseEventDateTime(e) >= now).sort((a, b) => parseEventDateTime(a) - parseEventDateTime(b));
    const past = [...(events || [])].filter(e => parseEventDateTime(e) < now).sort((a, b) => parseEventDateTime(b) - parseEventDateTime(a));
    return [...upcoming, ...past];
  }, [events]);

  const listEvents = selectedDayEvents.length > 0 ? selectedDayEvents : allSortedEvents;

  const moveMonth = (offset) => {
    const next = new Date(monthDate);
    next.setMonth(monthDate.getMonth() + offset);
    setMonthDate(next);
  };

  const jumpToToday = () => {
    setMonthDate(new Date());
    setSelectedDay(new Date());
  };

  const handleDayClick = (d) => {
    setSelectedDay(d);
    setSwipedEventId(null);
    setViewMode('list');
  };

  const handleDeleteEvent = (id) => {
    const ev = events.find(e => String(e.id) === String(id));
    if (ev) setUndoEvent(ev);
    onDelete(id);
    setSwipedEventId(null);
    setTimeout(() => setUndoEvent(null), 4000);
  };

  // Tap-outside resets swipe
  useEffect(() => {
    const handler = (e) => {
      if (listRef.current && !listRef.current.contains(e.target)) {
        setSwipedEventId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const dateStr = eventDate || new Date().toISOString().split('T')[0];
    onAdd({ title, time: time || 'TBD', location: location || 'Home', date: dateStr, color: 'bg-indigo-500' });
    setTitle(''); setTime(''); setLocation(''); setEventDate('');
    setIsModalOpen(false);
  };

  const monthName = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const DAY_HEADERS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const COLOR_POOL = ['bg-indigo-500','bg-emerald-500','bg-pink-500','bg-amber-500','bg-blue-500','bg-violet-500'];

  return (
    <div className="space-y-4 animate-bounce-in">
      {/* Header */}
      <RevealCard delay={0}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule</h2>
          <div className="flex items-center gap-2">
            {/* Cal / List toggle */}
            <div className="flex items-center bg-slate-100 rounded-2xl p-1 gap-0.5">
              <button
                onClick={() => setViewMode('calendar')}
                className={`spring-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                <CalendarIcon className="w-3.5 h-3.5" /> Cal
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`spring-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-90" /> List
              </button>
            </div>
            {isParent && (
              <button onClick={() => setIsModalOpen(true)} className="spring-press w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-900/20">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </RevealCard>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <AgentSuggestionCard
              key={suggestion.id}
              icon={suggestion.icon || '📅'}
              title={suggestion.title}
              subtitle={suggestion.subtitle}
              reasoning={suggestion.reasoning}
              source={suggestion.source}
              confidence={suggestion.confidence}
              onApprove={() => onApproveSuggestion?.(suggestion)}
              onDismiss={() => onDismissSuggestion?.(suggestion.id)}
              approveLabel={suggestion.approveLabel || 'Apply'}
            />
          ))}
        </div>
      )}

      {/* Full Month Calendar */}
      {viewMode === 'calendar' && (
        <RevealCard delay={60}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => moveMonth(-1)} className="spring-press p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={jumpToToday} className="font-bold text-slate-800 text-sm tracking-wide hover:text-indigo-600 transition-colors">{monthName}</button>
            <button onClick={() => moveMonth(1)} className="spring-press p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(h => (
              <div key={h} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1">{h}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((d, i) => {
              const isCurrentMonth = d.getMonth() === monthDate.getMonth();
              const isTodayDate = isSameDate(d, today);
              const isSelected = isSameDate(d, selectedDay);
              const dayEvs = eventsForDay(d);
              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(d)}
                  className={`spring-press flex flex-col items-center justify-start pt-1.5 pb-1 h-14 rounded-2xl transition-all
                    ${isCurrentMonth ? '' : 'opacity-25'}
                    ${isSelected && !isTodayDate ? 'bg-indigo-50 ring-1 ring-indigo-200' : ''}
                    ${!isSelected && !isTodayDate ? 'hover:bg-slate-50' : ''}
                  `}
                >
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full leading-none
                    ${isTodayDate ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/40' : isSelected ? 'text-indigo-600' : 'text-slate-700'}
                  `}>{d.getDate()}</span>
                  {/* Event dots */}
                  {dayEvs.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvs.slice(0,3).map((ev,j) => (
                        <div key={j} className={`w-1.5 h-1.5 rounded-full ${ev.color || COLOR_POOL[j % COLOR_POOL.length]}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </RevealCard>
      )}

      {/* List section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {selectedDayEvents.length > 0
              ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : viewMode === 'list' ? 'All Events' : 'Today'}
          </p>
          {selectedDayEvents.length > 0 && (
            <button
              onClick={() => { setSelectedDay(null); }}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
            >Show all</button>
          )}
        </div>

        <div className="space-y-3" ref={listRef}>
          {listEvents.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl ring-1 ring-black/5">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-slate-400 font-medium text-sm">No events yet</p>
              {isParent && (
                <button onClick={() => setIsModalOpen(true)} className="mt-3 text-indigo-500 font-bold text-sm hover:text-indigo-700">Add Event →</button>
              )}
            </div>
          )}
          {listEvents.map((event, idx) => {
            const isPast = parseEventDateTime(event) < new Date();
            return (
            <RevealCard key={event.id} delay={idx * 50}>
              <div className="relative overflow-hidden rounded-3xl">
                <div
                  onClick={() => { if (isParent) setSwipedEventId(swipedEventId === event.id ? null : event.id); }}
                  className={`bg-white rounded-3xl shadow-sm ring-1 ring-black/5 flex items-center gap-4 p-4 transition-all duration-300 cursor-pointer ${isParent && swipedEventId === event.id ? '-translate-x-16' : 'translate-x-0'} ${isPast ? 'opacity-50' : ''}`}
                >
                  <div className={`w-1 h-14 rounded-full shrink-0 ${event.color || 'bg-indigo-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-sm ${isPast ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{event.title}</p>
                      {isPast && <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Past</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {event.time && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/>{event.time}</span>}
                      {event.location && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3"/>{event.location}</span>}
                    </div>
                    {event.date && (
                      <span className="text-[9px] font-bold text-indigo-400 mt-0.5 block">
                        {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                {isParent && swipedEventId === event.id && (
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="absolute right-0 top-0 bottom-0 w-16 bg-rose-500 flex items-center justify-center rounded-r-3xl"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </RevealCard>
            );
          })}
        </div>
      </div>

      {/* Undo toast — positioned above the floating bottom nav (nav ≈ 80px + 16px margin = 96px) */}
      {undoEvent && (
        <div className="fixed left-4 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
          <span className="text-sm font-medium">Event deleted</span>
          <button onClick={() => { onAdd({...undoEvent}); setUndoEvent(null); }} className="text-indigo-300 font-bold text-sm hover:text-white transition-colors">Undo</button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Event">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Event Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium transition-all" placeholder="e.g., Dentist Appointment" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date</label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Time</label>
              <input type="text" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium" placeholder="e.g., 2:00 PM" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium" placeholder="e.g., Clinic" />
            </div>
          </div>
          <button type="submit" className="spring-press w-full py-4 rounded-2xl font-bold text-base bg-slate-900 text-white shadow-md shadow-slate-900/20 mt-2">Add Event</button>
        </form>
      </Modal>
    </div>
  );
};


const MealsView = ({ meals, onAdd, onUpdate, onDelete, isParent, groceries, setGroceries, suggestions = [], onApproveSuggestion, onDismissSuggestion }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [meal, setMeal] = useState('');
  const [day, setDay] = useState('Today');
  const [prepTime, setPrepTime] = useState('30m');

  const handleAddSubmit = (e) => { e.preventDefault(); if (!meal.trim()) return; onAdd({ meal, day, prepTime: prepTime + ' prep' }); setMeal(''); setIsModalOpen(false); };
  const handleEditClick = () => { setEditForm({ ...selectedMeal }); setIsEditing(true); };
  const handleEditSubmit = (e) => { e.preventDefault(); if (!editForm.meal.trim()) return; onUpdate(editForm); setSelectedMeal(editForm); setIsEditing(false); };
  const closeMealModal = () => { setSelectedMeal(null); setIsEditing(false); };

  const generateGroceries = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const allIngredients = meals.reduce((acc, meal) => {
        if (meal.ingredients) return [...acc, ...meal.ingredients.split('\n').filter(i => i.trim())];
        return acc;
      }, []);
      const uniqueItems = [...new Set(allIngredients)].map((item, i) => ({ id: i, name: item, checked: false }));
      setGroceries(uniqueItems);
      setIsGenerating(false);
    }, 800);
  };

  const toggleGrocery = (id) => setGroceries(groceries.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
  const openGroceryList = () => { if (groceries.length === 0) generateGroceries(); setIsGroceryModalOpen(true); };

  return (
    <div className="space-y-5 animate-bounce-in">
      <RevealCard delay={0}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Meal Plan</h2>
            <p className="text-slate-400 font-medium text-sm mt-0.5">What's cooking this week?</p>
          </div>
          <div className="flex gap-2">
            <button onClick={openGroceryList} className="spring-press w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-sm ring-1 ring-black/5">
              <ShoppingCart className="w-4 h-4" strokeWidth={2} />
            </button>
            {isParent && (
              <button onClick={() => setIsModalOpen(true)} className="spring-press w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-900/20">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </RevealCard>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion) => (
            <AgentSuggestionCard
              key={suggestion.id}
              icon={suggestion.icon || '🍽️'}
              title={suggestion.title}
              subtitle={suggestion.subtitle}
              reasoning={suggestion.reasoning}
              source={suggestion.source}
              confidence={suggestion.confidence}
              onApprove={() => onApproveSuggestion?.(suggestion)}
              onDismiss={() => onDismissSuggestion?.(suggestion.id)}
              approveLabel={suggestion.approveLabel || 'Add meal'}
            />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {meals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl ring-1 ring-black/5">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-slate-400 font-medium text-sm">No meals planned yet</p>
          </div>
        )}
        {meals.map((meal, idx) => (
          <RevealCard key={meal.id} delay={idx * 60}>
            <div onClick={() => setSelectedMeal(meal)} className="spring-press bg-white rounded-3xl overflow-hidden shadow-md ring-1 ring-slate-900/6 cursor-pointer group transition-all active:scale-[0.98]">
              {/* Gradient banner */}
              <div className="h-20 relative flex items-center justify-center" style={{background:'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)'}}>
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'16px 16px'}} />
                <Utensils className="w-8 h-8 text-white/80" strokeWidth={1.5} />
                <div className="absolute top-3 left-3">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${meal.day === 'Today' ? 'bg-white text-orange-600' : 'bg-white/20 text-white'}`}>{meal.day}</span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-white" />
                  <span className="text-white text-[9px] font-bold">{meal.prepTime}</span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-slate-800 text-base leading-tight">{meal.meal}</h4>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {(meal.tags || []).map(tag => <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase tracking-wider">{tag}</span>)}
                </div>
              </div>
            </div>
          </RevealCard>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Recipe">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recipe Name</label>
            <input type="text" value={meal} onChange={e => setMeal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium" placeholder="e.g., Chicken Parmesan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Day</label>
              <select value={day} onChange={e => setDay(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium"><option>Today</option><option>Tomorrow</option></select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prep Time</label>
              <select value={prepTime} onChange={e => setPrepTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium"><option value="15m">15 mins</option><option value="30m">30 mins</option></select>
            </div>
          </div>
          <button type="submit" className="spring-press w-full py-4 rounded-2xl font-bold text-base bg-slate-900 text-white shadow-md shadow-slate-900/20 mt-2">Save Recipe</button>
        </form>
      </Modal>

      <Modal isOpen={!!selectedMeal} onClose={closeMealModal} title={isEditing ? "Edit Recipe" : (selectedMeal?.meal || "Recipe")} fullHeight>
        {selectedMeal && !isEditing && (
          <div className="space-y-6">
            <div className="flex gap-2"><Badge variant="premium">{selectedMeal.day}</Badge><Badge variant="default">{selectedMeal.prepTime}</Badge></div>
            <div className="bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-900/5"><h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Utensils className="w-4 h-4"/> Ingredients</h4><ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">{(selectedMeal.ingredients || "").split('\n').map((item, i) => <li key={i}>{item}</li>)}</ul></div>
            <div className="bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-900/5"><h4 className="font-bold text-slate-800 mb-2">Instructions</h4><ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2">{(selectedMeal.instructions || "").split('\n').map((item, i) => <li key={i}>{item}</li>)}</ol></div>
            <div className="flex gap-3">
              <Button onClick={closeMealModal} variant="secondary" className="flex-1">Close</Button>
              {isParent && (
                <>
                  <Button onClick={handleEditClick} className="flex-1">Edit Plan</Button>
                  <Button onClick={() => { closeMealModal(); onDelete(selectedMeal.id); }} variant="secondary" className="!w-auto !px-4 !bg-rose-50 !text-rose-500 !border-rose-200 hover:!bg-rose-100">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        {selectedMeal && isEditing && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Recipe Name</label><input type="text" value={editForm.meal} onChange={e => setEditForm({...editForm, meal: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" required /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Ingredients</label><textarea value={editForm.ingredients} onChange={e => setEditForm({...editForm, ingredients: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Instructions</label><textarea value={editForm.instructions} onChange={e => setEditForm({...editForm, instructions: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]" /></div>
            <div className="flex gap-3 pt-2"><Button type="button" onClick={() => setIsEditing(false)} variant="secondary" className="flex-1">Cancel</Button><Button type="submit" className="flex-1">Save Changes</Button></div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isGroceryModalOpen} onClose={() => setIsGroceryModalOpen(false)} title="🛒 Grocery List" fullHeight>
        <div className="flex flex-col h-full h-[60vh]">
          <div className="flex items-center justify-between bg-slate-50 text-slate-700 p-3 rounded-xl border border-slate-200 mb-4 shrink-0">
            <div className="flex items-center gap-2"><Wand2 className="w-4 h-4 text-purple-500" /><span className="text-sm font-bold">Generated from Meals</span></div>
            <button onClick={generateGroceries} className="text-xs font-bold bg-white px-2 py-1 rounded-lg shadow-sm hover:scale-105 transition-transform active:scale-95 border border-slate-200">Regenerate</button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar pb-4 relative">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3"><Loader2 className="w-8 h-8 text-slate-400 animate-spin" /><p className="text-sm font-medium text-slate-500">Compiling ingredients...</p></div>
            ) : (
              <div className="space-y-2">
                {groceries.map(item => (
                  <div key={item.id} onClick={() => toggleGrocery(item.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${item.checked ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${item.checked ? 'bg-slate-800 border-slate-800' : 'border-slate-300'}`}>{item.checked && <Check className="w-3 h-3 text-white" />}</div>
                    <span className={`font-medium ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => setIsGroceryModalOpen(false)} className="mt-auto shrink-0 pt-2">Close List</Button>
        </div>
      </Modal>
    </div>
  );
};

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 5000];
const LEVEL_NAMES = ['Rookie', 'Helper', 'Star', 'Champion', 'Legend', 'Hero', 'GOAT'];
const LEVEL_COLORS = [
  'from-slate-400 to-slate-500',
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-yellow-300 to-amber-500',
];

const getLevelInfo = (pts) => {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pts >= LEVEL_THRESHOLDS[i]) { level = i; break; }
  }
  const nextLevel = Math.min(level + 1, LEVEL_THRESHOLDS.length - 1);
  const current = LEVEL_THRESHOLDS[level];
  const next = LEVEL_THRESHOLDS[nextLevel];
  const progress = level === nextLevel ? 100 : Math.round(((pts - current) / (next - current)) * 100);
  return { level, name: LEVEL_NAMES[level], color: LEVEL_COLORS[level], progress, ptsToNext: Math.max(0, next - pts), nextName: LEVEL_NAMES[nextLevel] };
};

const RewardsView = ({ rewards, points, onRedeem, onAddReward, onDeleteReward, isParent, allUsers = [], userPoints = {}, tasks = [] }) => {
  const { isChild } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('rewards'); // 'rewards' | 'leaderboard' | 'history'
  const [redeemingId, setRedeemingId] = useState(null);
  const [justRedeemed, setJustRedeemed] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(50);
  const [newRewardEmoji, setNewRewardEmoji] = useState('🎁');

  const levelInfo = getLevelInfo(points);
  const nextReward = rewards.filter(r => r.cost > points).sort((a, b) => a.cost - b.cost)[0];

  const completedTasks = tasks.filter(t => t.status === 'approved');
  const streak = Math.min(completedTasks.length, 7); // simplified streak

  // Leaderboard data
  const leaderboard = Object.entries(userPoints)
    .map(([name, pts]) => ({ name, pts, user: allUsers.find(u => u.name === name) }))
    .sort((a, b) => b.pts - a.pts);

  const handleRedeem = async (reward) => {
    if (points < reward.cost) return;
    setRedeemingId(reward.id);
    await new Promise(r => setTimeout(r, 600));
    onRedeem(reward.cost, reward);
    setJustRedeemed(reward);
    setRedeemingId(null);
    setTimeout(() => setJustRedeemed(null), 3000);
  };

  const handleAddReward = () => {
    if (!newRewardTitle.trim()) return;
    onAddReward({ title: newRewardTitle, cost: newRewardCost, emoji: newRewardEmoji });
    setNewRewardTitle('');
    setNewRewardCost(50);
    setNewRewardEmoji('🎁');
    setIsAddModalOpen(false);
  };

  const EMOJI_OPTIONS = ['🎁','🎮','🍕','🍦','🎬','🏆','⭐','🎨','🎯','🚀','💎','🦄','🎪','🏖️','🎠'];

  return (
    <div className="space-y-4 animate-bounce-in">

      {/* JUST REDEEMED CELEBRATION */}
      {justRedeemed && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          <div className="animate-reward-pop flex flex-col items-center gap-3 bg-white rounded-[2rem] shadow-2xl p-8 ring-2 ring-amber-300 max-w-[280px] w-full mx-4 pointer-events-none">
            <div className="text-6xl">{justRedeemed.emoji || '🎉'}</div>
            <p className="text-xl font-black text-slate-900 text-center leading-tight">Reward Unlocked!</p>
            <p className="text-sm font-bold text-slate-500 text-center">{justRedeemed.title}</p>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" style={{animationDelay:`${i*80}ms`}} />)}
            </div>
          </div>
        </div>
      )}

      {/* HERO — Level + Points */}
      <RevealCard delay={0}>
        <div className="relative overflow-hidden rounded-3xl p-5" style={{background:`linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)`}}>
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 flex items-start justify-between mb-4">
            <div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${levelInfo.color} shadow-lg mb-2`}>
                <Crown className="w-3 h-3 text-white" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">{levelInfo.name}</span>
              </div>
              <p className="text-5xl font-black text-white tracking-tight">{points.toLocaleString()}</p>
              <p className="text-white/40 text-xs font-bold mt-1">total points</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                <span className="text-3xl animate-streak-flame">🔥</span>
              </div>
              <p className="text-white/60 text-[9px] font-black uppercase tracking-wider">{streak} streak</p>
            </div>
          </div>

          {/* XP Progress bar */}
          {levelInfo.ptsToNext > 0 && (
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-white/50 text-[10px] font-bold">Level up → {levelInfo.nextName}</span>
                <span className="text-white/60 text-[10px] font-black">{levelInfo.ptsToNext} pts to go</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${levelInfo.color} rounded-full animate-xp-bar`}
                  style={{width:`${levelInfo.progress}%`}}
                />
              </div>
            </div>
          )}
          {levelInfo.ptsToNext === 0 && (
            <div className="relative z-10 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl">
              <span className="text-yellow-300 text-lg">👑</span>
              <span className="text-white font-bold text-sm">Max Level Achieved!</span>
            </div>
          )}
        </div>
      </RevealCard>

      {/* TAB BAR */}
      <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
        {[
          { id: 'rewards', label: '🎁 Rewards' },
          { id: 'leaderboard', label: '🏆 Board' },
          ...(isParent ? [{ id: 'manage', label: '⚙️ Manage' }] : []),
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* REWARDS TAB */}
      {activeTab === 'rewards' && (
        <div className="space-y-3">
          {/* Next reward teaser */}
          {nextReward && !isParent && (
            <div className="bg-indigo-50 rounded-3xl p-4 ring-1 ring-indigo-100 flex items-center gap-3">
              <div className="text-3xl">{nextReward.emoji || '🎯'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">Almost there!</p>
                <p className="font-bold text-slate-800 text-sm truncate">{nextReward.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{width:`${Math.round((points/nextReward.cost)*100)}%`}} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-500 shrink-0">{nextReward.cost - points} pts</span>
                </div>
              </div>
            </div>
          )}

          {rewards.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl ring-1 ring-black/5">
              <div className="text-5xl mb-3">🎁</div>
              <p className="text-slate-500 font-bold">No rewards yet</p>
              {isParent && <p className="text-slate-400 text-sm mt-1">Add rewards for your kids to unlock!</p>}
            </div>
          )}

          {rewards.map((reward, idx) => {
            const canAfford = points >= reward.cost;
            const isRedeeming = redeemingId === reward.id;
            const ptsNeeded = reward.cost - points;
            return (
              <RevealCard key={reward.id} delay={idx * 50}>
                <div className={`relative overflow-hidden rounded-3xl transition-all ${canAfford && !isParent ? 'ring-2 ring-amber-300 shadow-lg shadow-amber-100' : 'ring-1 ring-black/5'}`}>
                  {/* Locked overlay */}
                  {!canAfford && !isParent && (
                    <div className="absolute inset-0 bg-white/60 z-10 rounded-3xl flex items-center justify-end pr-5">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-black text-slate-500">{ptsNeeded} more pts</span>
                      </div>
                    </div>
                  )}
                  <div className={`bg-white p-4 flex items-center gap-4 ${!canAfford && !isParent ? 'opacity-60' : ''}`}>
                    {/* Emoji badge */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${canAfford && !isParent ? 'bg-amber-50 shadow-inner' : 'bg-slate-50'}`}>
                      {reward.emoji || '🎁'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 text-base leading-tight">{reward.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span className="text-sm font-black text-amber-600">{reward.cost.toLocaleString()} pts</span>
                      </div>
                      {/* Mini progress bar for kids */}
                      {!isParent && (
                        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden w-full">
                          <div className={`h-full rounded-full transition-all ${canAfford ? 'bg-amber-400' : 'bg-slate-300'}`} style={{width:`${Math.min(100, Math.round((points/reward.cost)*100))}%`}} />
                        </div>
                      )}
                    </div>
                    {/* Action button */}
                    {!isParent ? (
                      <button
                        disabled={!canAfford || isRedeeming}
                        onClick={() => handleRedeem(reward)}
                        className={`spring-press shrink-0 w-14 h-14 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-0.5 transition-all ${
                          isRedeeming ? 'bg-amber-300 scale-90' :
                          canAfford ? 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-400/40 hover:bg-amber-300 active:scale-95' :
                          'bg-slate-100 text-slate-300'
                        }`}
                      >
                        {isRedeeming ? <Loader2 className="w-5 h-5 animate-spin" /> : canAfford ? <><span className="text-lg">🎉</span><span>Claim!</span></> : <Lock className="w-4 h-4" />}
                      </button>
                    ) : (
                      <button onClick={() => onDeleteReward?.(reward.id)} className="spring-press shrink-0 w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 hover:bg-rose-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </RevealCard>
            );
          })}
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <RevealCard delay={0}>
            <div className="space-y-2">
              {leaderboard.length === 0 && (
                <div className="text-center py-10 text-slate-400 font-medium">No family members yet</div>
              )}
              {leaderboard.map((entry, idx) => {
                const li = getLevelInfo(entry.pts);
                const medals = ['🥇','🥈','🥉'];
                const isMe = entry.name === (allUsers.find(u => u)?.name);
                return (
                  <div key={entry.name} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${idx === 0 ? 'bg-amber-50 ring-2 ring-amber-200' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                    <span className="text-2xl w-8 text-center shrink-0">{medals[idx] || `#${idx+1}`}</span>
                    {entry.user ? (
                      <Avatar user={entry.user} size="sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{entry.name?.[0]}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 text-sm truncate">{entry.name}</p>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${li.color} mt-0.5`}>
                        <span className="text-white text-[9px] font-black">{li.name}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-slate-900 text-base">{entry.pts.toLocaleString()}</p>
                      <p className="text-slate-400 text-[10px] font-bold">pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </RevealCard>

          {/* Level guide */}
          <RevealCard delay={100}>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Level Guide</p>
              <div className="grid grid-cols-2 gap-2">
                {LEVEL_NAMES.map((name, i) => (
                  <div key={name} className={`flex items-center gap-2 p-2.5 rounded-2xl ${getLevelInfo(points).level === i ? 'ring-2 ring-indigo-300 bg-indigo-50' : 'bg-slate-50'}`}>
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${LEVEL_COLORS[i]} shrink-0`} />
                    <div>
                      <p className="text-xs font-black text-slate-700">{name}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{LEVEL_THRESHOLDS[i].toLocaleString()}+ pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealCard>
        </div>
      )}

      {/* MANAGE TAB (parents only) */}
      {activeTab === 'manage' && isParent && (
        <div className="space-y-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="spring-press w-full py-4 rounded-3xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Add New Reward
          </button>

          {rewards.length === 0 && (
            <div className="text-center py-10 bg-white rounded-3xl ring-1 ring-black/5">
              <div className="text-4xl mb-3">🎁</div>
              <p className="text-slate-500 font-bold text-sm">No rewards yet</p>
              <p className="text-slate-400 text-xs mt-1">Add some to motivate your kids!</p>
            </div>
          )}

          {rewards.map((reward, idx) => (
            <RevealCard key={reward.id} delay={idx * 40}>
              <div className="bg-white rounded-3xl p-4 ring-1 ring-black/5 flex items-center gap-4">
                <div className="text-3xl w-12 text-center">{reward.emoji || '🎁'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800">{reward.title}</p>
                  <p className="text-xs font-bold text-amber-600 mt-0.5">⭐ {reward.cost} pts</p>
                </div>
                <button onClick={() => onDeleteReward?.(reward.id)} className="spring-press w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 hover:bg-rose-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </RevealCard>
          ))}
        </div>
      )}

      {/* ADD REWARD MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Reward">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pick an emoji</p>
            <div className="grid grid-cols-5 gap-2">
              {EMOJI_OPTIONS.map(em => (
                <button key={em} onClick={() => setNewRewardEmoji(em)}
                  className={`text-2xl p-2.5 rounded-2xl transition-all ${newRewardEmoji === em ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110' : 'bg-slate-50 hover:bg-slate-100'}`}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Reward Name</label>
            <input
              value={newRewardTitle}
              onChange={e => setNewRewardTitle(e.target.value)}
              placeholder="e.g., Extra screen time"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cost: {newRewardCost} pts</label>
            <input
              type="range" min="10" max="500" step="10"
              value={newRewardCost}
              onChange={e => setNewRewardCost(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
              <span>10 pts</span><span>Easy</span><span>Hard</span><span>500 pts</span>
            </div>
          </div>
          <button
            onClick={handleAddReward}
            disabled={!newRewardTitle.trim()}
            className="spring-press w-full py-4 rounded-2xl font-bold bg-slate-900 text-white disabled:opacity-40"
          >
            Add Reward 🎁
          </button>
        </div>
      </Modal>
    </div>
  );
};

const SettingsView = ({ user, isParent, onLogout, allUsers = [], userPoints = {}, tasks = [], onBack, onUpdateMember, onAddMember, onDeleteMember }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [editName, setEditName] = useState(user?.name || '');
  const handleModalClose = () => setActiveModal(null);
  const photoInputRef = useRef(null);
  const handlePhotoClick = () => { if (photoInputRef.current) photoInputRef.current.click(); };
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataURL = ev.target.result;
      if (onUpdateMember) onUpdateMember(user.id, { photoURL: dataURL });
    };
    reader.readAsDataURL(file);
  };

  const myPoints = userPoints[user?.name] || 0;
  const totalPoints = Object.values(userPoints).reduce((a, b) => a + b, 0);
  const completedTasks = tasks.filter(t => t.status === 'approved' && (!isParent || true)).length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const myCompleted = tasks.filter(t => t.status === 'approved' && t.assignee === user?.name).length;

  const stats = isParent
    ? [
        { label: 'Family Pts', value: totalPoints, emoji: '⭐' },
        { label: 'Done', value: completedTasks, emoji: '✓' },
        { label: 'Pending', value: pendingCount, emoji: '⏳' },
      ]
    : [
        { label: 'My Points', value: myPoints, emoji: '⭐' },
        { label: 'Completed', value: myCompleted, emoji: '✓' },
        { label: 'Day Streak', value: '5', emoji: '🔥' },
      ];

  return (
    // Profile page: break out of the parent px-4 padding with -mx-4 to achieve a
    // full-bleed hero banner. The -mt-6 compensates for the content area's pt-6.
    // We do NOT use sm:-mx-6 here because the parent container has no sm:px-6.
    <div className="animate-bounce-in -mx-4 -mt-6">

      {/* HERO BANNER — full-bleed edge-to-edge */}
      <div className="relative h-44 overflow-hidden" style={{background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'}}>
        <div className="absolute top-[-20%] right-[-5%] w-72 h-72 bg-indigo-400/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[-5%] w-64 h-64 bg-violet-400/15 rounded-full blur-[60px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize:'20px 20px'}} />
        {onBack && (
          <button onClick={onBack} className="spring-press absolute top-5 left-4 w-9 h-9 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all z-10">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="absolute top-5 right-4 z-10">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Profile</span>
        </div>
      </div>

      {/* AVATAR OVERLAP */}
      <div className="flex flex-col items-center -mt-14 pb-5 px-4">
        <div className="relative mb-4">
          <Avatar user={user} size="xxl" className="ring-[5px] ring-white shadow-2xl shadow-slate-900/20" />
          <label className="absolute bottom-1 right-1 w-8 h-8 bg-slate-900 border-[2.5px] border-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-700 active:scale-90 transition-all cursor-pointer">
            <Camera className="w-3.5 h-3.5 text-white" />
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.name}</h2>
        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isParent ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {user?.role}
          </span>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500">Kinflow Family</span>
        </div>
      </div>

      {/* Content area: restore px-4 padding, and use safe-area-aware bottom padding
           so content is never hidden behind the floating nav on any device. */}
      <div className="px-4 space-y-5" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 96px, 144px)' }}>

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`rounded-2xl p-4 text-center shadow-sm ring-1 ring-black/5 ${i===0 ? 'bg-indigo-50' : i===1 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <div className="text-xl mb-1.5">{stat.emoji}</div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* YOUR FAMILY */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Your Family</h3>
          <div className="bg-white rounded-[1.75rem] ring-1 ring-slate-900/5 p-4 shadow-sm">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {allUsers.map(u => (
                <div
                  key={u.id}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${u.id === user?.id ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'hover:bg-slate-50'}`}
                >
                  <Avatar user={u} size="md" />
                  <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">{u.name}</span>
                  <span className="text-[9px]">{u.role === 'Parent' ? '👑' : '⭐'}</span>
                </div>
              ))}
            </div>
            {isParent && (
              <button
                onClick={() => setActiveModal('family')}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" /> Manage Members
              </button>
            )}
          </div>
        </div>

        {/* ACCOUNT SETTINGS */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Account</h3>
          <div className="bg-white rounded-[1.75rem] ring-1 ring-slate-900/5 overflow-hidden shadow-sm divide-y divide-slate-50">
            <SettingRow onClick={() => setActiveModal('editProfile')} icon={User} label="Edit Profile" value={user?.name} />
            <SettingRow onClick={() => setActiveModal('notifications')} icon={BellRing} label="Notifications" value="Enabled" />
            {isParent && (
              <SettingRow onClick={() => setActiveModal('subscription')} icon={CreditCard} label="Subscription" value={<span className="text-indigo-600 font-bold">Premium ✦</span>} />
            )}
          </div>
        </div>

        {/* SUBSCRIPTION CARD (parents only) */}
        {isParent && (
          <div className="relative overflow-hidden rounded-[1.75rem] p-5 shadow-lg" style={{background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'}}>
            <div className="absolute top-[-20%] right-[-5%] w-40 h-40 bg-white/10 rounded-full blur-[40px]" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Premium Plan</span>
                </div>
                <h4 className="text-xl font-bold text-white leading-tight mb-1">Kinflow Family</h4>
                <p className="text-white/60 text-xs font-medium">All features unlocked · AI Copilot included</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-white text-xs font-bold">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* APPEARANCE / THEMES */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Appearance</h3>
          <div className="bg-white rounded-[1.75rem] ring-1 ring-slate-900/5 overflow-hidden shadow-sm divide-y divide-slate-50">
            <SettingRow onClick={() => setActiveModal('themes')} icon={Settings} label="App Theme" value="Classic" />
          </div>
        </div>

        {isParent && (
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Preferences</h3>
            <div className="bg-white rounded-[1.75rem] ring-1 ring-slate-900/5 overflow-hidden shadow-sm divide-y divide-slate-50">
              <SettingRow icon={Settings} label="App Preferences" onClick={() => {}} />
            </div>
          </div>
        )}

        {/* SIGN OUT */}
        <button
          onClick={() => setActiveModal('logout')}
          className="w-full py-4 rounded-[1.25rem] bg-rose-50 text-rose-600 font-bold text-sm ring-1 ring-rose-100 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>

      </div>

      {/* MODALS */}
      <Modal isOpen={activeModal === 'editProfile'} onClose={handleModalClose} title="Edit Profile">
        <div className="space-y-4">
          <div className="flex flex-col items-center mb-6">
            <Avatar user={user} size="xl" className="ring-4 ring-white shadow-md mb-4" />
            <p className="text-xs font-semibold text-slate-500">Tap avatar above to change photo</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Display Name</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Role</label>
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-medium text-sm">{user?.role} (cannot change)</div>
          </div>
          <Button onClick={handleModalClose} className="mt-2">Save Changes</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'family'} onClose={handleModalClose} title="Family Members">
        <div className="space-y-3">
          {allUsers.map((member) => (
            <div key={member.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-[1.25rem] ring-1 ring-slate-100">
              <div className="flex items-center gap-3">
                <Avatar user={member} size="sm" />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">{member.name}</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{member.role}</span>
                </div>
              </div>
              <Button variant="secondary" className="!w-auto !py-1.5 !px-3 text-xs">Edit</Button>
            </div>
          ))}
          <button className="w-full mt-2 py-3 rounded-[1.25rem] border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'notifications'} onClose={handleModalClose} title="Notifications">
        <div className="space-y-4">
          {[
            { label: 'Chore Reminders', sub: 'Get notified when tasks are assigned', on: true },
            { label: 'Approvals', sub: 'Alert when a child submits proof', on: true },
            { label: 'Chat Messages', sub: 'Family chat notifications', on: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
              <div>
                <p className="font-bold text-sm text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{item.sub}</p>
              </div>
              <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${item.on ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${item.on ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
        <Button onClick={handleModalClose} className="mt-5">Done</Button>
      </Modal>

      <Modal isOpen={activeModal === 'subscription'} onClose={handleModalClose} title="Subscription">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[1.5rem] p-5" style={{background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'}}>
            <Star className="w-8 h-8 text-amber-300 fill-amber-300 mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">Premium Family Plan</h4>
            <p className="text-white/60 text-sm">All features · AI Copilot · Unlimited members</p>
          </div>
          <Button onClick={handleModalClose} variant="secondary">Close</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'themes'} onClose={handleModalClose} title="App Theme">
        <div className="space-y-5">
          <p className="text-sm font-medium text-slate-500">Choose a theme for your Kinflow experience. All themes stay fully legible.</p>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Parent Themes</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Classic', desc: 'Deep indigo & violet', gradient: 'from-indigo-600 to-violet-700', selected: true },
                { name: 'Slate', desc: 'Professional dark slate', gradient: 'from-slate-700 to-slate-900', selected: false },
                { name: 'Ocean', desc: 'Blue & teal tones', gradient: 'from-blue-600 to-teal-600', selected: false },
                { name: 'Forest', desc: 'Calm greens & earth', gradient: 'from-emerald-600 to-green-800', selected: false },
              ].map(t => (
                <div key={t.name} className={`relative rounded-2xl overflow-hidden cursor-pointer ring-2 transition-all ${t.selected ? 'ring-indigo-500 shadow-lg shadow-indigo-200' : 'ring-transparent hover:ring-slate-200'}`}>
                  <div className={`h-16 bg-gradient-to-br ${t.gradient}`} />
                  <div className="bg-white p-2.5">
                    <p className="font-bold text-sm text-slate-800">{t.name}</p>
                    <p className="text-[10px] font-medium text-slate-400">{t.desc}</p>
                  </div>
                  {t.selected && <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm"><Check className="w-3 h-3 text-indigo-500" strokeWidth={3} /></div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Kids Themes (Fun & Bright)</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Sky Kids', desc: 'Bright sky blue', gradient: 'from-sky-400 to-cyan-500', selected: false },
                { name: 'Sunshine', desc: 'Warm amber & yellow', gradient: 'from-amber-400 to-yellow-400', selected: false },
                { name: 'Berry', desc: 'Playful pink & purple', gradient: 'from-pink-500 to-purple-500', selected: false },
                { name: 'Lime', desc: 'Fresh green & mint', gradient: 'from-lime-400 to-emerald-400', selected: false },
              ].map(t => (
                <div key={t.name} className="relative rounded-2xl overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-slate-200 transition-all">
                  <div className={`h-16 bg-gradient-to-br ${t.gradient}`} />
                  <div className="bg-white p-2.5">
                    <p className="font-bold text-sm text-slate-800">{t.name}</p>
                    <p className="text-[10px] font-medium text-slate-400">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] font-medium text-slate-400 text-center">Theme switching coming in the next update ✨</p>
          <Button onClick={handleModalClose} variant="secondary">Done</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'logout'} onClose={handleModalClose} title="Sign Out">
        <div className="space-y-4">
          <p className="text-slate-600 font-medium">Are you sure you want to sign out of Kinflow?</p>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={handleModalClose} className="flex-1">Cancel</Button>
            <Button onClick={() => { handleModalClose(); onLogout(); }} className="flex-1 !bg-rose-500 hover:!bg-rose-600 !shadow-none">Sign Out</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};


const SETTING_ROW_COLORS = ['bg-indigo-100 text-indigo-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600', 'bg-blue-100 text-blue-600', 'bg-violet-100 text-violet-600'];
let _settingRowIndex = 0;

const SettingRow = ({ icon: Icon, label, value, className = '', iconClass = '', hideArrow = false, onClick }) => {
  const colorClass = SETTING_ROW_COLORS[_settingRowIndex % SETTING_ROW_COLORS.length];
  _settingRowIndex++;
  return (
    <div onClick={onClick} className={`spring-press flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${iconClass || colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-bold text-sm text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-medium text-slate-400">{value}</span>}
        {!hideArrow && <ChevronRight className="w-4 h-4 text-slate-300" />}
      </div>
    </div>
  );
};

const AICopilotModal = ({ isOpen, onClose, familyContext = {}, initialMessage = null }) => {
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hi! I'm your Kinflow Copilot. I know your family's tasks, schedule, and meals. Ask me anything — or try a quick action below." }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const firedInitial = useRef(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen, isLoading]);

  // Reset conversation and fire initialMessage each time modal opens
  useEffect(() => {
    if (isOpen) {
      setMessages([{ role: 'ai', text: "Hi! I'm your Kinflow Copilot. I know your family's tasks, schedule, and meals. Ask me anything — or try a quick action below." }]);
      firedInitial.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialMessage && !firedInitial.current) {
      firedInitial.current = true;
      // Small delay so the reset above settles first
      setTimeout(() => handleSend(initialMessage), 120);
    }
  }, [isOpen, initialMessage]);

  // Build rich context string from live family data
  const buildContextSummary = () => {
    const { tasks = [], events = [], meals = [], users = [], userPoints = {} } = familyContext;
    const openTasks = tasks.filter(t => t.status === 'open');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const upcomingEvents = events.filter(e => e.date && new Date(e.date + 'T23:59:59') >= new Date()).slice(0, 5);
    const children = users.filter(u => u.role === 'Child');
    const pointsSummary = children.map(c => `${c.name}: ${userPoints[c.name] || 0}pts`).join(', ');
    return `
FAMILY STATE (live data):
- Members: ${users.map(u => `${u.name} (${u.role})`).join(', ')}
- Open chores: ${openTasks.length} (${openTasks.map(t => `"${t.title}" → ${t.assignee||'unassigned'}`).slice(0,5).join(', ')})
- Pending review: ${pendingTasks.length} (${pendingTasks.map(t => `"${t.title}"`).join(', ')})
- Upcoming events: ${upcomingEvents.map(e => `"${e.title}" on ${e.date}${e.time?' at '+e.time:''}`).join(', ') || 'none'}
- Meals this week: ${meals.slice(0,4).map(m => m.meal).join(', ') || 'none planned'}
- Kids points: ${pointsSummary || 'no kids'}
Today is ${new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}.
`.trim();
  };

  const handleSend = async (presetText = null) => {
    const textToSend = presetText || input;
    if (!textToSend.trim() || isLoading) return;
    
    const newMessages = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = ""; 
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      const contextSummary = buildContextSummary();
      const systemPrompt = `You are Kinflow Copilot, an intelligent family organizer AI. You have access to the family's live data below. Use it to give specific, personalized advice — not generic suggestions.

${contextSummary}

Rules:
- Always reference actual family members, tasks, and events by name when relevant
- Be concise (2-4 sentences max unless listing items)  
- Be warm and practical
- If asked to create tasks/plans, describe them specifically so the parent can act on them
- Use occasional emojis`;

      const geminiMessages = newMessages.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages
      };

      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that right now.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Oops, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "Plan chores for this week",
    "Who hasn't done anything lately?",
    "Suggest dinner ideas",
    "Any scheduling conflicts?",
    "How are the kids doing?"
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Copilot" fullHeight>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-indigo-700">Kinflow Copilot</span>
            <p className="text-[10px] text-indigo-400 font-medium">Knows your family's live data</p>
          </div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 mb-1">
                  <Wand2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[82%] px-4 py-3 text-sm font-medium leading-relaxed shadow-sm
                ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-3xl rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-3xl rounded-bl-md ring-1 ring-black/5'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0">
                <Wand2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-3xl rounded-bl-md bg-slate-100 ring-1 ring-black/5 flex items-center gap-2 text-sm font-medium text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {messages.length < 3 && !isLoading && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 pt-1 shrink-0">
            {quickActions.map(action => (
              <button key={action} onClick={() => handleSend(action)} className="spring-press whitespace-nowrap bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
                {action}
              </button>
            ))}
          </div>
        )}
        <div className="relative mt-auto shrink-0 pt-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} disabled={isLoading} placeholder={isLoading ? "Copilot is thinking..." : "Ask about your family..."} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-2xl pl-5 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all font-medium disabled:opacity-50" />
          <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="spring-press absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl transition-all disabled:opacity-50 shadow-md shadow-indigo-500/25">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

// --- PREMIUM NAV ITEM ---
const NavItem = ({ icon: Icon, label, isActive, onClick }) => {
  const [bouncing, setBouncing] = useState(false);
  const handleTap = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 500);
    onClick();
  };
  return (
    <button
      onClick={handleTap}
      className="flex flex-col items-center justify-center flex-1 px-2 py-2 gap-0.5 relative spring-press"
      style={{WebkitTapHighlightColor:'transparent'}}
    >
      <div className={`${bouncing ? 'animate-nav-bounce' : ''} ${isActive ? 'text-indigo-600' : 'text-slate-400'} transition-colors duration-200`}>
        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
      </div>
      <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-indigo-600' : 'text-slate-400'} transition-colors`}>{label}</span>
      {isActive && <div className="absolute bottom-1.5 w-1 h-1 bg-indigo-600 rounded-full" />}
    </button>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState(() => { try { return localStorage.getItem('kinflow_activeTab') || 'home'; } catch(e) { return 'home'; } });
  const [activeUser, setActiveUser] = useState(() => { try { const saved = localStorage.getItem('kinflow_lastProfile'); return saved ? JSON.parse(saved) : null; } catch(e) { return null; } }); 
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(() => { try { return localStorage.getItem('kinflow_hasOnboarded') === 'true'; } catch(e) { return false; } });
  const [showOnboarding, setShowOnboarding] = useState(false);
    
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
  const [rewards, setRewards] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [agentSuggestions, setAgentSuggestions] = useState([]);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kinflow_dismissed_suggestions') || '[]'); } catch { return []; }
  });
  
  // Non-Firebase States
  const [groceries, setGroceries] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInitialMessage, setCopilotInitialMessage] = useState(null);

  const openCopilot = (prefill = null) => {
    setCopilotInitialMessage(prefill);
    setIsCopilotOpen(true);
  };
  const [undoDelete, setUndoDelete] = useState(null); // { message, onUndo }
  const [users, setUsers] = useState([]);



  const isParent = activeUser?.role === 'Parent';
  const isChild = activeUser?.role === 'Child';

  // Dynamic Greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  const [authReady, setAuthReady] = useState(false);

  // Persist activeTab to localStorage
  useEffect(() => {
    try { localStorage.setItem('kinflow_activeTab', activeTab); } catch(e) {}
  }, [activeTab]);

  // Persist activeUser to localStorage
  useEffect(() => {
    try {
      if (activeUser) localStorage.setItem('kinflow_lastProfile', JSON.stringify(activeUser));
      else localStorage.removeItem('kinflow_lastProfile');
    } catch(e) {}
  }, [activeUser]);

  // Persist hasOnboarded to localStorage
  useEffect(() => {
    try { localStorage.setItem('kinflow_hasOnboarded', String(hasOnboarded)); } catch(e) {}
  }, [hasOnboarded]);


  useEffect(() => {
    if (!auth) return;
    let cleanup;
    // Subscribe to auth state changes. Since we're using signInWithPopup on all platforms,
    // we don't need to handle getRedirectResult() separately. The popup flow is synchronous
    // and onAuthStateChanged will fire immediately with the correct user state.
    const unsubscribe = onAuthStateChanged(auth, user => {
      console.log('[AUTH] Auth state changed:', {
        email: user?.email,
        uid: user?.uid,
        isAnonymous: user?.isAnonymous,
        exists: !!user
      });
      setFirebaseUser(user);
      setAuthReady(true);
    });
    cleanup = unsubscribe;
    return () => cleanup?.();
  }, []);
  // Derived: logged in = Firebase user is real (not anonymous) and auth has initialized
  const isLoggedIn = authReady && !!firebaseUser && !firebaseUser.isAnonymous;

  // Sync DB
  useEffect(() => {
    if (!firebaseUser) return;
    const dataPath = 'public';
    const collPath = 'data';

    const tasksRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_tasks');
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      if (snap.empty) { /* No seeding — start fresh */ }
      else setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const msgsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_messages');
    const unsubMsgs = onSnapshot(msgsRef, (snap) => {
      if (snap.empty) { /* No seeding — start fresh */ }
      else setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const pointsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_points');
    const unsubPoints = onSnapshot(pointsRef, (snap) => {
      if (snap.empty) {
        /* seed removed */;
        /* seed removed */;
      } else {
        let p = {};
        snap.docs.forEach(d => { p[d.id] = d.data().points; });
        setUserPoints(p);
      }
    }, console.error);

    const eventsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_events');
    const unsubEvents = onSnapshot(eventsRef, (snap) => {
      if (snap.empty) { /* No seeding — start fresh */ }
      else setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const mealsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_meals');
    const unsubMeals = onSnapshot(mealsRef, (snap) => {
      if (snap.empty) { /* No seeding — start fresh */ }
      else setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const notifRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_notifications');
    const unsubNotifs = onSnapshot(notifRef, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, console.error);

    const usersRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_users');
    const unsubUsers = onSnapshot(usersRef, (snap) => {
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (a.createdAt||0)-(b.createdAt||0));
      setUsers(loaded);
    }, console.error);

    const rewardsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_rewards');
    const unsubRewards = onSnapshot(rewardsRef, (snap) => {
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    }, console.error);

    const agentSuggestionsRef = collection(db, 'artifacts', appId, dataPath, collPath, 'kinflow_agent_suggestions');
    const unsubAgentSuggestions = onSnapshot(agentSuggestionsRef, (snap) => {
      setAgentSuggestions(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, () => setAgentSuggestions([]));

    return () => { unsubTasks(); unsubMsgs(); unsubPoints(); unsubEvents(); unsubMeals(); unsubNotifs(); unsubUsers(); unsubRewards(); unsubAgentSuggestions(); };
  }, [firebaseUser]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  // TOAST PUSH NOTIFICATION LISTENER
  // Track which notif IDs we've already toasted so we never miss or double-fire
  const seenNotifIds = useRef(new Set());

  useEffect(() => {
    if (!activeUser || notifications.length === 0) return;

    // Find notifications targeted at the current user that we haven't shown yet
    const mine = notifications.filter(n => {
      const targeted = isParent ? n.target === 'Parent' : n.target === activeUser.name;
      const unseen = !seenNotifIds.current.has(n.id);
      // Only show notifications from the last 30 seconds (handles tab switches, profile switches)
      const fresh = n.createdAt > Date.now() - 30000;
      return targeted && unseen && fresh;
    });

    // Mark all current notifications as seen regardless (so old ones never pop up)
    notifications.forEach(n => seenNotifIds.current.add(n.id));

    if (mine.length > 0) {
      // Show the most recent one
      const newest = mine.sort((a, b) => b.createdAt - a.createdAt)[0];
      setLatestToast(newest);
      setTimeout(() => setLatestToast(null), 4500);
    }
  }, [notifications, activeUser, isParent]);

  // EVENT REMINDER SYSTEM
  // Tracks which event IDs have already fired a reminder so we don't double-notify
  const firedReminders = useRef(new Set());

  useEffect(() => {
    if (!activeUser || !isParent) return; // Only parent fires reminders (they're the scheduler)

    const checkUpcoming = () => {
      const now = Date.now();
      (events || []).forEach(ev => {
        if (!ev.date) return;

        // Parse the event's full datetime
        let eventMs;
        if (ev.time) {
          const t = ev.time.match(/(\d+):?(\d*)\s*(am|pm)?/i);
          if (t) {
            let h = parseInt(t[1]), m = parseInt(t[2] || '0');
            const ampm = (t[3] || '').toLowerCase();
            if (ampm === 'pm' && h < 12) h += 12;
            if (ampm === 'am' && h === 12) h = 0;
            const dt = new Date(ev.date + 'T00:00:00');
            dt.setHours(h, m, 0, 0);
            eventMs = dt.getTime();
          }
        }
        if (!eventMs) return; // Can't calculate without a parseable time — skip

        const msUntil = eventMs - now;
        const thirtyMinKey = `${ev.id}-30min`;
        const startKey = `${ev.id}-start`;

        // 30-minute warning: fire when between 29–31 minutes away
        if (msUntil > 29 * 60000 && msUntil <= 31 * 60000 && !firedReminders.current.has(thirtyMinKey)) {
          firedReminders.current.add(thirtyMinKey);
          const target = ev.assignee || 'Parent'; // notify assignee if set, else parent
          users.forEach(u => {
            sendNotification(
              `⏰ Starting in 30 min`,
              `"${ev.title}"${ev.location ? ` at ${ev.location}` : ''} starts at ${ev.time}`,
              u.role === 'Parent' ? 'Parent' : u.name
            );
          });
        }

        // At-start alert: fire when between -1 and +1 minute of start
        if (msUntil >= -60000 && msUntil <= 60000 && !firedReminders.current.has(startKey)) {
          firedReminders.current.add(startKey);
          users.forEach(u => {
            sendNotification(
              `🚨 Starting now!`,
              `"${ev.title}"${ev.location ? ` at ${ev.location}` : ''} is starting now`,
              u.role === 'Parent' ? 'Parent' : u.name
            );
          });
        }
      });
    };

    // Check immediately, then every 60 seconds
    checkUpcoming();
    const interval = setInterval(checkUpcoming, 60000);
    return () => clearInterval(interval);
  }, [events, activeUser, isParent, users]);

  const handleLogin = (user) => {
    setActiveUser(user);
    // Reset seen notification IDs so this profile sees its own fresh notifications
    seenNotifIds.current = new Set();
    // Only show onboarding for Parent role if they haven't completed it yet
    if (user.role === 'Parent' && !hasOnboarded) {
      setShowOnboarding(true);
    }
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setHasOnboarded(true);
    try { localStorage.setItem('kinflow_hasOnboarded', 'true'); } catch(e) {}
    triggerConfetti();
  };

  // --- NOTIFICATION DISPATCHER ---
  const sendNotification = async (title, body, targetUserOrRole) => {
    const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const notifData = { id: newId, title, body, target: targetUserOrRole, createdAt: Date.now(), read: false };
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_notifications', newId), notifData);
  };

  // --- ACTIONS ---
  
  const handleAddFamilyMember = async (memberData) => {
    const newId = Date.now().toString();
    const initials = memberData.name ? memberData.name.charAt(0).toUpperCase() : '?';
    const colors = ['from-emerald-400 to-teal-500','from-purple-400 to-violet-500','from-rose-400 to-pink-600','from-blue-500 to-indigo-600','from-amber-400 to-orange-500','from-cyan-400 to-blue-500'];
    const colorIdx = users.length % colors.length;
    const data = { 
      id: newId, 
      name: memberData.name || 'New Member', 
      role: memberData.role || 'Child', 
      initials, 
      color: memberData.color || colors[colorIdx],
      avatar: memberData.avatar || (memberData.role === 'Parent' ? 'parent' : 'child'),
      photoURL: memberData.photoURL || null,
      createdAt: Date.now() 
    };
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_users', newId), data);
    return data;
  };

  const handleUpdatePhoto = async (base64Photo) => {
    if (!activeUser || !firebaseUser || !db) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_users', activeUser.id);
    await updateDoc(ref, { photoURL: base64Photo });
    setActiveUser(prev => ({ ...prev, photoURL: base64Photo }));
    setUsers(prev => prev.map(u => u.id === activeUser.id ? { ...u, photoURL: base64Photo } : u));
  };

  const handleUpdateUser = async (userId, updates) => {
    if (!firebaseUser || !db) return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_users', userId);
    await updateDoc(ref, updates);
    if (activeUser?.id === userId) setActiveUser(prev => ({ ...prev, ...updates }));
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const handleUpdateFamilyMember = async (id, updates) => {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_users', id), updates);
    setUsers(prev => prev.map(u => u.id === id ? {...u, ...updates} : u));
    if (activeUser?.id === id) setActiveUser(prev => ({...prev, ...updates}));
  };

  const handleDeleteFamilyMember = async (id) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_users', id));
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleAddTask = async (newTask) => {
    const newId = Date.now().toString();
    const taskData = { ...newTask, id: newId, status: 'open', createdAt: Date.now() };
    // Optimistically update local state so the task appears immediately
    setTasks(prev => [...prev, taskData].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
    if (!firebaseUser) return; // local-only if not authenticated
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_tasks', newId), taskData);
      if (newTask.assignee && newTask.assignee !== 'Anyone') {
        sendNotification("New Chore", `You were assigned a new chore: "${newTask.title}"`, newTask.assignee);
      }
    } catch (e) {
      console.warn('Task save failed, keeping local copy', e);
    }
  };

  const requestDeleteTask = (id) => {
    const item = tasks.find(t => String(t.id) === String(id));
    if (!item) return;
    if (firebaseUser) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_tasks', id.toString()));
    setUndoDelete({ message: `"${item.title}" removed`, onUndo: () => {
        if (firebaseUser) setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_tasks', id.toString()), item);
      setUndoDelete(null);
    }});
    setTimeout(() => setUndoDelete(prev => prev && prev.message === `"${item.title}" removed` ? null : prev), 4500);
  };

  const handleTaskAction = async (taskId, action, extra = {}) => {
    const t = tasks.find(x => x.id === taskId || String(x.id) === String(taskId));
    if (!t || (!firebaseUser)) return;

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
      notifToSent = { title: "Needs Work", body: `Your parent asked you to redo "${t.title}".`, target: assignee };
    }
    else if (action === 'assign') {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_tasks', taskId.toString()), { assignee: extra.assignee || 'Anyone' });
      sendNotification('Task Assigned', `${extra.assignee || 'A family member'} was assigned "${t.title}".`, 'Parent');
      return;
    }

    if (newStatus === 'pending' || newStatus === 'approved') {
      if (t.status !== newStatus && action !== 'reject') triggerConfetti();
    }

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_tasks', taskId.toString()), { status: newStatus, photoUrl: newPhotoUrl });

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
    const msgData = { id: newId, senderId: activeUser.id, senderName: activeUser.name, text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), createdAt: Date.now() };
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_messages', newId), msgData);
    // Notify every other family member that a chat message arrived
    const otherUsers = users.filter(u => u.id !== activeUser.id);
    otherUsers.forEach(u => {
      sendNotification(
        `${activeUser.name} 💬`,
        text.length > 60 ? text.slice(0, 57) + '…' : text,
        u.role === 'Parent' ? 'Parent' : u.name
      );
    });
  };

  const requestDeleteMessage = (id) => {
    setConfirmActionState({ title: 'Delete Message', message: 'Remove this message for everyone in the family?', onConfirm: async () => {
        if (firebaseUser) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_messages', id.toString()));
      setConfirmActionState(null);
    }});
  };

  const handleRedeemReward = async (cost, reward) => {
    if (!activeUser) return;
    const pointsAvailable = userPoints[activeUser.name] || 0;
    if (!isParent && pointsAvailable >= cost) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_points', activeUser.name), { points: pointsAvailable - cost }, { merge: true });
      sendNotification('🎉 Reward Redeemed!', `${activeUser.name} unlocked "${reward?.title || 'a reward'}" for ${cost} pts!`, 'Parent');
      triggerConfetti();
    } else if (isParent) triggerConfetti();
  };

  const handleAddReward = async (newReward) => {
    const newId = Date.now().toString();
    const rewardData = { ...newReward, id: newId, createdAt: Date.now() };
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_rewards', newId), rewardData);
  };

  const handleDeleteReward = async (id) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_rewards', id.toString()));
  };

  const handleAddEvent = async (newEvent) => {
    const newId = Date.now().toString();
    const eventData = { ...newEvent, id: newId, color: 'bg-indigo-500', createdAt: Date.now() };
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_events', newId), eventData);
  };

  const requestDeleteEvent = (id) => {
    const item = events.find(e => String(e.id) === String(id));
    if (!item) return;
    if (firebaseUser) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_events', id.toString()));
    setUndoDelete({ message: `"${item.title}" removed`, onUndo: () => {
        if (firebaseUser) setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_events', id.toString()), item);
      setUndoDelete(null);
    }});
    setTimeout(() => setUndoDelete(prev => prev && prev.message === `"${item.title}" removed` ? null : prev), 4500);
  };

  const handleAddMeal = async (newMeal) => {
    const newId = Date.now().toString();
    const mealData = { ...newMeal, id: newId, tags: ['New Recipe'], createdAt: Date.now() };
    if (!firebaseUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_meals', newId), mealData);
  };

  const handleUpdateMeal = async (updatedMeal) => {
    if (false) { setMeals(prev => prev.map(m => String(m.id) === String(updatedMeal.id) ? { ...m, ...updatedMeal } : m)); return; }
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_meals', updatedMeal.id.toString()), updatedMeal);
  };

  const requestDeleteMeal = (id) => {
    const item = meals.find(m => String(m.id) === String(id));
    if (!item) return;
    if (firebaseUser) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_meals', id.toString()));
    setUndoDelete({ message: `"${item.meal}" removed`, onUndo: () => {
        if (firebaseUser) setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_meals', id.toString()), item);
      setUndoDelete(null);
    }});
    setTimeout(() => setUndoDelete(prev => prev && prev.message === `"${item.meal}" removed` ? null : prev), 4500);
  };

  const triggerConfetti = () => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1500); };

  const localTaskSuggestions = taskAgent.execute({ prompt: 'assign review overdue', tasks, familyMembers: users }).suggestions || [];
  const localMealSuggestions = mealAgent.execute({ prompt: 'healthy family dinners', inventory: groceries, mealHistory: meals, familySize: users.length || 4 }).suggestions || [];
  const localScheduleSuggestions = scheduleAgent.execute({ events }).suggestions || [];

  // Stable content hash — same logical suggestion always gets the same ID across renders/sessions
  const suggestionHash = (suggestion, source) => {
    const key = `${source}::${suggestion.title || ''}::${suggestion.subtitle || ''}::${suggestion.payload?.taskId || suggestion.payload?.assignee || suggestion.payload?.mealName || ''}`;
    let h = 0;
    for (let i = 0; i < key.length; i++) { h = Math.imul(31, h) + key.charCodeAt(i) | 0; }
    return `hash-${(h >>> 0).toString(16)}`;
  };

  const normalizeSuggestion = (suggestion, source = 'agent') => {
    const stableId = suggestion.id && !suggestion.id.includes('Date') ? suggestion.id : suggestionHash(suggestion, source);
    return {
      ...suggestion,
      id: stableId,
      source,
      icon: suggestion.icon || (source === 'task' ? '📋' : source === 'meal' ? '🍽️' : source === 'schedule' ? '📅' : source === 'proactive' ? '💡' : '🤖'),
      subtitle: suggestion.subtitle || suggestion.payload?.reason || suggestion.payload?.mealName || suggestion.payload?.taskId || '',
      reasoning: suggestion.reasoning || (
        source === 'task' ? `The task agent analyzed current assignments and workload distribution across your family.` :
        source === 'meal' ? `Based on your meal history and family size — variety and prep time were factored in.` :
        source === 'schedule' ? `The schedule agent scanned all events for conflicts and available time slots.` :
        source === 'proactive' ? suggestion.proactiveReason || `Proactively suggested based on upcoming week patterns.` :
        `Suggested by the automation agent based on recent family activity.`
      ),
    };
  };

  // PROACTIVE PLANNER — Sunday evening: suggest weekly chore planning
  const proactivePlannerFired = useRef(false);
  const proactiveSuggestions = React.useMemo(() => {
    const now = new Date();
    const isSundayEvening = now.getDay() === 0 && now.getHours() >= 17;
    const noMealsThisWeek = meals.length < 3;
    const unassignedTasks = tasks.filter(t => t.status === 'open' && (!t.assignee || t.assignee === 'Anyone'));
    const suggestions = [];

    if (isSundayEvening && unassignedTasks.length > 0) {
      suggestions.push({
        id: 'proactive-sunday-tasks',
        type: 'proactive',
        title: `Plan the week: ${unassignedTasks.length} chores unassigned`,
        proactiveReason: `It's Sunday evening — a great time to assign next week's chores so everyone knows their responsibilities.`,
        confidence: 0.9,
        payload: {},
      });
    }
    if (isSundayEvening && noMealsThisWeek) {
      suggestions.push({
        id: 'proactive-sunday-meals',
        type: 'proactive',
        title: `No dinners planned — set up the week`,
        proactiveReason: `It's Sunday and the meal plan is mostly empty. Planning ahead reduces weekday stress.`,
        confidence: 0.85,
        payload: {},
      });
    }
    // Monday morning: highlight any overdue tasks
    if (now.getDay() === 1 && now.getHours() < 10) {
      const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status === 'open');
      if (overdue.length > 0) {
        suggestions.push({
          id: 'proactive-monday-overdue',
          type: 'proactive',
          title: `${overdue.length} overdue chore${overdue.length > 1 ? 's' : ''} to address`,
          proactiveReason: `Starting the week with overdue tasks. Worth reassigning or following up with ${overdue.map(t=>t.assignee).filter(Boolean)[0] || 'the kids'}.`,
          confidence: 0.95,
          payload: {},
        });
      }
    }
    return suggestions;
  }, [tasks, meals]);

  const mergedSuggestions = (() => {
    const all = [
      ...agentSuggestions.filter((s) => (s.status || 'proposed') === 'proposed').map((s) => normalizeSuggestion(s, 'automation')),
      ...proactiveSuggestions.map((s) => normalizeSuggestion(s, 'proactive')),
      ...localTaskSuggestions.map((s) => normalizeSuggestion(s, 'task')),
      ...localMealSuggestions.map((s) => normalizeSuggestion(s, 'meal')),
      ...localScheduleSuggestions.map((s) => normalizeSuggestion(s, 'schedule')),
    ];
    // Deduplicate by stable hash ID — first occurrence wins
    const seen = new Set();
    return all.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return !dismissedSuggestionIds.includes(s.id);
    });
  })();

  const taskSuggestions = mergedSuggestions.filter((s) => s.agent === 'task' || s.type === 'assignment' || s.type === 'reminder');
  const mealSuggestions = mergedSuggestions.filter((s) => s.agent === 'meal' || s.type === 'meal_plan' || s.type === 'grocery_list');
  const calendarSuggestions = mergedSuggestions.filter((s) => s.agent === 'schedule' || s.type === 'conflict' || s.type === 'timeslot');
  const dashboardSuggestions = mergedSuggestions.slice(0, 3);

  const dismissSuggestion = async (suggestionId) => {
    setDismissedSuggestionIds((prev) => {
      const next = [...new Set([...prev, suggestionId])];
      try { localStorage.setItem('kinflow_dismissed_suggestions', JSON.stringify(next)); } catch {}
      return next;
    });
    const found = agentSuggestions.find((s) => String(s.id) === String(suggestionId));
    if (found && firebaseUser) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_agent_suggestions', suggestionId.toString()), { status: 'dismissed' });
    }
  };

  const approveSuggestion = async (suggestion) => {
    if (!suggestion) return;
    const payload = suggestion.payload || {};
    if (suggestion.type === 'assignment' && payload.taskId) {
      await handleTaskAction(payload.taskId, 'assign', { assignee: payload.assignee || 'Anyone' });
    } else if (suggestion.type === 'meal_plan') {
      await handleAddMeal({
        meal: payload.mealName || suggestion.title,
        day: 'This Week',
        prepTime: payload.prepMinutes ? `${payload.prepMinutes}m prep` : '30m prep',
        ingredients: (payload.missingIngredients || []).join('\n'),
      });
    } else if (suggestion.type === 'timeslot') {
      const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      await handleAddEvent({
        title: 'Suggested Focus Block',
        time: `${toTime(payload.start)}-${toTime(payload.end)}`,
        location: 'Home',
        date: new Date().toISOString().split('T')[0],
      });
    } else if (payload.taskId) {
      await handleTaskAction(payload.taskId, 'approve');
    }

    if (firebaseUser) {
      const found = agentSuggestions.find((s) => String(s.id) === String(suggestion.id));
      if (found) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_agent_suggestions', suggestion.id.toString()), { status: 'approved' });
      }
    }
    await dismissSuggestion(suggestion.id);
  };

  const renderContent = () => {
    const displayPoints = isParent ? Object.values(userPoints).reduce((a, b) => a + b, 0) : (userPoints[activeUser?.name] || 0);
    switch(activeTab) {
      case 'home': return <Dashboard tasks={tasks} events={events} points={displayPoints} activeUser={activeUser} isParent={isParent} onNavigate={setActiveTab} onOpenCopilot={isParent ? openCopilot : null} allUsers={users} suggestions={dashboardSuggestions} onApproveSuggestion={approveSuggestion} onDismissSuggestion={dismissSuggestion} />;
      case 'tasks': return <TasksView tasks={tasks} onAction={handleTaskAction} onAdd={handleAddTask} onDelete={requestDeleteTask} activeUser={activeUser} isParent={isParent} allUsers={users} suggestions={taskSuggestions} onApproveSuggestion={approveSuggestion} onDismissSuggestion={dismissSuggestion} />;
      case 'calendar': return <CalendarView events={events} onAdd={handleAddEvent} onDelete={requestDeleteEvent} isParent={isParent} suggestions={calendarSuggestions} onApproveSuggestion={approveSuggestion} onDismissSuggestion={dismissSuggestion} />;
      case 'meals': return <MealsView meals={meals} onAdd={handleAddMeal} onUpdate={handleUpdateMeal} onDelete={requestDeleteMeal} isParent={isParent} groceries={groceries} setGroceries={setGroceries} suggestions={mealSuggestions} onApproveSuggestion={approveSuggestion} onDismissSuggestion={dismissSuggestion} />;
      case 'rewards': return <RewardsView rewards={rewards} points={displayPoints} onRedeem={handleRedeemReward} onAddReward={handleAddReward} onDeleteReward={handleDeleteReward} isParent={isParent} allUsers={users} userPoints={userPoints} tasks={tasks} />;
      case 'chat': return <ChatView messages={messages} onSend={handleSendMessage} onDelete={requestDeleteMessage} allUsers={users} onApproveSuggestion={approveSuggestion} onDismissSuggestion={dismissSuggestion} />;
      case 'settings': return <SettingsView user={activeUser} isParent={isParent} onLogout={() => { setActiveUser(null); signOut(auth); }} allUsers={users} userPoints={userPoints} tasks={tasks} onUpdatePhoto={handleUpdatePhoto} onUpdateUser={handleUpdateUser} onBack={() => setActiveTab('home')} onUpdateMember={handleUpdateFamilyMember} onAddMember={handleAddFamilyMember} onDeleteMember={handleDeleteFamilyMember} />;
      default: return null;
    }
  };

  const pendingApprovalTasks = tasks.filter(t => t.status === 'pending');

  // Filter My Notifications
  const myNotifications = notifications
    .filter(n => isParent ? n.target === 'Parent' : n.target === activeUser?.name)
    .sort((a,b) => b.createdAt - a.createdAt);
  const unreadNotifsCount = myNotifications.filter(n => !n.read).length;

  const markNotifsAsRead = () => {
    if (false) { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); return; }
    myNotifications.forEach(async (n) => {
      if (!n.read && firebaseUser) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'kinflow_notifications', n.id), { read: true });
      }
    });
  };

  if (showSplash || !authReady) return <SplashScreen />;
  if (!isLoggedIn) return <AuthScreen />;
  if (!activeUser) return <ProfileSelectorScreen onLogin={handleLogin} users={users} onLogout={() => signOut(auth)} onAddMember={handleAddFamilyMember} firebaseUser={firebaseUser} />;
  if (showOnboarding) return <OnboardingFlow onComplete={completeOnboarding} />;

  const navItems = isParent 
    ? [
        { id: 'home', icon: Home, label: 'Today' },
        { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'calendar', icon: CalendarDays, label: 'Plan' },
        { id: 'meals', icon: ChefHat, label: 'Meals' },
        { id: 'rewards', icon: Trophy, label: 'Rewards' },
      ]
    : [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'tasks', icon: CheckSquare, label: 'Chores' },
        { id: 'rewards', icon: Trophy, label: 'Rewards' },
        { id: 'chat', icon: MessageCircle, label: 'Chat' },
      ];

  

  return (
    <ThemeContext.Provider value={{ isChild, user: activeUser }}>
      <div className="min-h-screen font-sans flex flex-col relative bg-slate-50 text-slate-800">
        <CustomStyles />
        <Confetti active={showConfetti} />

        {/* PREMIUM TOAST */}
        {latestToast && (
          <div className="fixed top-0 inset-x-0 z-[100] flex justify-center" style={{paddingTop:'max(env(safe-area-inset-top, 12px), 12px)'}}>
            <div className="mx-4 bg-slate-900/95 backdrop-blur-xl text-white px-5 py-4 rounded-3xl shadow-2xl ring-1 ring-white/10 flex items-center gap-3 animate-slide-up max-w-sm w-full">
              <div className="w-9 h-9 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">{latestToast.title}</p>
                <p className="text-white/50 text-xs font-medium mt-0.5 truncate">{latestToast.body}</p>
              </div>
            </div>
          </div>
        )}

        {/* UNDO DELETE TOAST — positioned above the floating bottom nav (nav ≈ 80px + 16px margin = 96px) */}
        {undoDelete && (
          <div className="fixed inset-x-0 z-[98] flex justify-center px-4 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
            <div className="bg-slate-900/96 backdrop-blur-xl text-white px-5 py-4 rounded-3xl shadow-2xl ring-1 ring-white/10 flex items-center gap-3 max-w-sm w-full animate-slide-up pointer-events-auto">
              <Trash2 className="w-4 h-4 text-white/40 shrink-0" />
              <span className="flex-1 text-sm font-medium text-white/80">{undoDelete.message}</span>
              <button onClick={() => { undoDelete.onUndo(); }} className="spring-press text-indigo-400 font-bold text-sm hover:text-indigo-300 transition-colors shrink-0 px-2 py-1 bg-indigo-500/20 rounded-xl">Undo</button>
            </div>
          </div>
        )}

        {/* TOP APP BAR — fixed so it never clips or scrolls away */}
        <div
          className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 border-b border-slate-200/60"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: '10px',
            background: 'rgba(248,250,252,0.97)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            minHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
          }}
        >
          <div className="pt-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{
              {home:'Today', tasks: isParent ? 'Tasks' : 'My Chores', calendar:'Schedule', meals:'Meals', chat:'Family Chat', rewards:'Rewards', settings:'Profile'}[activeTab] || 'Kinflow'
            }</p>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Kinflow</h1>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {isParent && (
              <button onClick={() => openCopilot()} className="spring-press w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/25">
                <Wand2 className="w-4 h-4 text-white" strokeWidth={2} />
              </button>
            )}
            {isParent && (
              <button onClick={() => setActiveTab('chat')} className={`spring-press relative w-9 h-9 rounded-2xl flex items-center justify-center ring-1 transition-colors ${activeTab === 'chat' ? 'bg-slate-900 ring-slate-900' : 'bg-white ring-black/8'}`}>
                <MessageCircle className={`w-4 h-4 ${activeTab === 'chat' ? 'text-white' : 'text-slate-600'}`} strokeWidth={2} />
              </button>
            )}
            <button onClick={() => { setIsNotifModalOpen(true); markNotifsAsRead(); }} className="spring-press relative w-9 h-9 bg-white rounded-2xl flex items-center justify-center ring-1 ring-black/8">
              <Bell className="w-4 h-4 text-slate-600" strokeWidth={2} />
              {unreadNotifsCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{unreadNotifsCount}</span>}
            </button>
            {/* Avatar: tap = switch profile, long-press / hold = settings */}
            <button
              onClick={() => setIsUserSwitcherOpen(true)}
              onContextMenu={e => { e.preventDefault(); setActiveTab('settings'); }}
              className="spring-press"
              title="Tap to switch profile · Hold for settings"
            >
              <Avatar user={activeUser} size="sm" className="ring-2 ring-white shadow-md" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT — non-chat tabs only */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            minHeight: 0,
            display: activeTab === 'chat' ? 'none' : 'block',
          }}
        >
          <div className="px-4 pt-6 pb-36 max-w-lg mx-auto w-full">
            {activeTab !== 'chat' && renderContent()}
          </div>
        </div>

        {/* CHAT — completely independent fixed layer, never affects scroll state of other tabs */}
        {activeTab === 'chat' && (
          <div
            className="fixed inset-0 flex flex-col"
            style={{
              paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))',
              paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
              zIndex: 10,
            }}
          >
            <div className="flex-1 px-4 max-w-lg mx-auto w-full flex flex-col min-h-0">
              {renderContent()}
            </div>
          </div>
        )}

        {/* Global Notifications Modal */}
        <Modal isOpen={isNotifModalOpen} onClose={() => setIsNotifModalOpen(false)} title="Notifications" fullHeight>
          <div className="space-y-3">
            {myNotifications.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No new notifications!</p>
              </div>
            ) : (
              myNotifications.map(n => (
                <div key={n.id} className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex gap-4">
                  <div className="bg-white p-2 rounded-full shadow-sm shrink-0 h-fit">
                    <BellRing className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">{n.body}</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2">
                      {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>

        {/* Global Confirmation Modal */}
        <Modal isOpen={!!confirmActionState} onClose={() => setConfirmActionState(null)} title={confirmActionState?.title || "Confirm"}>
          <div className="space-y-4">
            <p className="text-slate-500 font-medium text-sm leading-relaxed">{confirmActionState?.message}</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmActionState(null)} className="spring-press flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={confirmActionState?.onConfirm} className="spring-press flex-1 py-3.5 rounded-2xl font-bold text-sm bg-rose-500 text-white shadow-md shadow-rose-500/25">Delete</button>
            </div>
          </div>
        </Modal>

        {/* No standalone FAB - AI Copilot is in the top bar */}

        <AICopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} familyContext={{ tasks, events, meals, users, userPoints }} initialMessage={copilotInitialMessage} />

        <Modal isOpen={isUserSwitcherOpen} onClose={() => setIsUserSwitcherOpen(false)} title="Switch Profile">
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} onClick={() => { setActiveUser(user); seenNotifIds.current = new Set(); setIsUserSwitcherOpen(false); }} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${activeUser?.id === user.id ? 'bg-slate-100 ring-2 ring-slate-400' : 'bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-900/5'}`}>
                <Avatar user={user} size="md" />
                <div><h4 className="font-bold text-slate-800">{user.name}</h4><p className="text-xs font-medium text-slate-500">{user.role}</p></div>
                {activeUser?.id === user.id && <Check className="w-5 h-5 text-slate-800 ml-auto" />}
              </div>
            ))}
            {/* Divider */}
            <div className="border-t border-slate-100 pt-2 space-y-2">
              {isParent && (
                <button
                  onClick={() => { setIsUserSwitcherOpen(false); setActiveTab('settings'); }}
                  className="spring-press w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-900/5 transition-all"
                >
                  <div className="w-9 h-9 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-sm">Manage Members</p>
                    <p className="text-xs text-slate-400 font-medium">Add, edit or remove family</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                </button>
              )}
              <button
                onClick={() => { setIsUserSwitcherOpen(false); setActiveTab('settings'); }}
                className="spring-press w-full flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-900/5 transition-all"
              >
                <div className="w-9 h-9 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800 text-sm">Settings & Profile</p>
                  <p className="text-xs text-slate-400 font-medium">Account, photo, preferences</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
              </button>
            </div>
          </div>
        </Modal>

        {/* PREMIUM BOTTOM NAV */}
        <div className="fixed bottom-0 inset-x-0 z-40" style={{paddingBottom:'env(safe-area-inset-bottom, 0px)'}}>
          <div className="mx-4 mb-4">
            <nav className={`${'bg-white/95 backdrop-blur-2xl ring-1 ring-black/5'} rounded-[2rem] shadow-[0_-2px_40px_rgba(0,0,0,0.12)] flex items-center px-2 py-1`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <NavItem
                    key={item.id}
                    icon={Icon}
                    label={item.label}
                    isActive={isActive}
                    onClick={() => setActiveTab(item.id)}
                  />
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
