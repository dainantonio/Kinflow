import React, { useState, useReducer, useEffect, createContext, useContext, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Home, CheckSquare, Calendar as CalendarIcon, Gift, MessageSquare, 
  Settings, UserCircle, Bell, Sparkles, ChevronRight, CheckCircle2, 
  Clock, Plus, ShieldCheck, Zap, BrainCircuit, X, Lock, Users, AlertCircle, ArrowRight,
  Send, TrendingUp, Flame, Trophy, ChefHat, CloudSun, Target, Heart,
  Crown, Smile, User, Check, ChevronLeft, Sun, BookOpen, Moon,
  Sunrise, Sunset, ListTodo, Activity, UtensilsCrossed, Star, Trash2, UserPlus,
  RefreshCw, Smartphone, CreditCard, ShoppingCart, Loader2
} from 'lucide-react';

// --- FIREBASE INIT ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- AI UTILITIES ---
const fetchWithRetry = async (url, options, retries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

const generateSmartPlan = async (kidsContext) => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const prompt = `You are the FamilyOS AI. Create a personalized daily plan.
  Generate exactly 1 age-appropriate chore and 1 educational/homework task for each child listed below.
  Prefix every task title with '✨ AI: '. Make the titles fun, engaging, and brief (under 5 words).
  Assign 10 to 100 points based on difficulty.
  
  Children:
  ${kidsContext}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          tasks: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                assignedToUserId: { type: "STRING" },
                title: { type: "STRING" },
                type: { type: "STRING", enum: ["CHORE", "HOMEWORK"] },
                points: { type: "INTEGER" },
                proofRequired: { type: "BOOLEAN" }
              },
              required: ["assignedToUserId", "title", "type", "points", "proofRequired"]
            }
          }
        },
        required: ["tasks"]
      }
    }
  };

  const data = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return JSON.parse(data.candidates[0].content.parts[0].text);
};

const generateSmartRecipe = async (userPrompt) => {
  const apiKey = ""; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const prompt = `You are a family chef AI. Create a family-friendly recipe based on this request: "${userPrompt}".
  Return ONLY a valid JSON object matching this schema. Make instructions short and actionable.
  {
    "title": "Recipe Name",
    "prepTime": "15m",
    "cookTime": "20m",
    "ingredients": ["1 cup rice", "2 chicken breasts"],
    "instructions": ["Step 1", "Step 2"]
  }`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          prepTime: { type: "STRING" },
          cookTime: { type: "STRING" },
          ingredients: { type: "ARRAY", items: { type: "STRING" } },
          instructions: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["title", "prepTime", "cookTime", "ingredients", "instructions"]
      }
    }
  };

  const data = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return JSON.parse(data.candidates[0].content.parts[0].text);
};

// --- MOCK DATABASE ---
const seedData = {
  family: { id: 'f1', name: 'Smith Family', plan: 'FREE', onboarded: false, pushEnabled: false, calendarSynced: false },
  users: [
    { id: 'u1', familyId: 'f1', role: 'PARENT', name: 'Alice (Mom)', level: null, streak: null, avatar: '👩' },
    { id: 'u2', familyId: 'f1', role: 'PARENT', name: 'Bob (Dad)', level: null, streak: null, avatar: '👨' },
    { id: 'u3', familyId: 'f1', role: 'TEEN', name: 'Charlie (14)', level: 4, streak: 12, avatar: '👦' },
    { id: 'u4', familyId: 'f1', role: 'CHILD', name: 'Daisy (9)', level: 2, streak: 5, avatar: '👧' }
  ],
  tasks: [],
  pointsLedger: [],
  rewards: [
    { id: 'r1', familyId: 'f1', title: '1 Hour Screen Time', costPoints: 100, active: true },
    { id: 'r2', familyId: 'f1', title: 'Pizza Night Choice', costPoints: 500, active: true },
    { id: 'r3', familyId: 'f1', title: 'New Video Game', costPoints: 2000, active: true }
  ],
  events: [],
  messages: [],
  usageCounters: [
    { id: 'c1', familyId: 'f1', monthKey: new Date().toISOString().slice(0, 7), aiActionsUsed: 0 }
  ],
  recipes: [
    { id: 'rec1', title: 'Taco Tuesday Setup', prepTime: '15m', cookTime: '10m', ingredients: ['1 lb Ground Beef', 'Taco Seasoning', '12 Taco Shells', 'Shredded Cheese', 'Lettuce'], instructions: ['Brown the beef in a skillet.', 'Add taco seasoning and water.', 'Simmer for 5 minutes.', 'Serve with shells and toppings.'] },
    { id: 'rec2', title: 'Quick Mac & Cheese', prepTime: '5m', cookTime: '15m', ingredients: ['1 box Macaroni', '1/2 cup Milk', '4 tbsp Butter'], instructions: ['Boil water and cook macaroni.', 'Drain water.', 'Add milk, butter, and cheese powder.', 'Stir until creamy.'] }
  ],
  mealPlan: [
    { id: 'mp1', date: new Date().toISOString().split('T')[0], type: 'Dinner', recipeId: 'rec1' }
  ],
  shoppingList: [
    { id: 'sl1', name: 'Milk', isChecked: false },
    { id: 'sl2', name: 'Eggs', isChecked: true },
    { id: 'sl3', name: 'Apples', isChecked: false }
  ]
};

// --- STATE MANAGEMENT ---
function appReducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;
    case 'COMPLETE_ONBOARDING':
      return { ...state, family: { ...state.family, onboarded: true } };
    case 'SETUP_FAMILY': {
      const { familyName, members } = action.payload;
      const newUsers = members.map(m => ({
        id: m.id, familyId: state.family.id, role: m.role,
        name: m.name || (m.role === 'PARENT' ? 'Parent' : 'Kid'),
        level: m.role !== 'PARENT' ? 1 : null, streak: m.role !== 'PARENT' ? 0 : null
      }));
      const newPoints = newUsers.filter(u => u.role !== 'PARENT').map(u => ({
        id: Math.random().toString(), userId: u.id, amount: 100, reason: 'Welcome Bonus', createdAt: new Date().toISOString()
      }));
      const welcomeTasks = newUsers.filter(u => u.role !== 'PARENT').map(u => ({
         id: Math.random().toString(), familyId: state.family.id, assignedToUserId: u.id,
         title: 'Explore FamilyOS', type: 'GENERAL', status: 'TODO', points: 50, proofRequired: false,
         dueAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date().toISOString()
      }));
      return {
        ...state, family: { ...state.family, name: familyName || 'My Family' }, users: newUsers,
        pointsLedger: newPoints, tasks: welcomeTasks, events: [],
        messages: [{ id: 'm1', familyId: state.family.id, senderId: newUsers[0].id, channelId: 'FAMILY', text: `Welcome to the ${familyName || 'Family'} FamilyOS!`, isTask: false, isEvent: false, createdAt: new Date().toISOString() }]
      };
    }
    case 'UPDATE_WEEK_STYLE': return { ...state, family: { ...state.family, weekStyle: action.payload } };
    case 'ADD_TEMPLATE_TASKS': {
      const assignee = state.users.find(u => u.role !== 'PARENT') || state.users[0];
      const newTasks = action.payload.map(t => ({
        id: Math.random().toString(), familyId: state.family.id, assignedToUserId: assignee.id,
        title: t.title, type: t.type, status: 'TODO', points: t.points, proofRequired: t.type === 'CHORE',
        dueAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date().toISOString()
      }));
      return { ...state, tasks: [...state.tasks, ...newTasks] };
    }
    case 'ADD_TEMPLATE_REWARDS': {
      const newRewards = action.payload.map(r => ({
        id: Math.random().toString(), familyId: state.family.id, title: r.title, costPoints: r.points, active: true
      }));
      return { ...state, rewards: newRewards };
    }
    case 'UPDATE_NOTIFICATION_PREFS': return { ...state, family: { ...state.family, notificationPrefs: action.payload } };
    case 'TOGGLE_PUSH_NOTIFICATIONS': return { ...state, family: { ...state.family, pushEnabled: action.payload } };
    case 'SYNC_EXTERNAL_CALENDAR': {
      const newEvents = action.payload.map(e => ({ ...e, id: Math.random().toString(), familyId: state.family.id, status: 'ACTIVE' }));
      return { ...state, family: { ...state.family, calendarSynced: true }, events: [...state.events, ...newEvents] };
    }
    case 'CHANGE_PLAN': return { ...state, family: { ...state.family, plan: action.payload } };
    case 'START_TASK': return { ...state, tasks: state.tasks.map(t => t.id === action.payload ? { ...t, status: 'IN_PROGRESS' } : t) };
    case 'COMPLETE_TASK': {
      const task = state.tasks.find(t => t.id === action.payload);
      const newStatus = task.proofRequired ? 'NEEDS_APPROVAL' : 'DONE';
      let newState = { ...state, tasks: state.tasks.map(t => t.id === action.payload ? { ...t, status: newStatus } : t) };
      if (!task.proofRequired) {
        newState.pointsLedger = [...newState.pointsLedger, { id: Math.random().toString(), userId: task.assignedToUserId, amount: task.points, reason: `Completed: ${task.title}`, createdAt: new Date().toISOString() }];
      }
      return newState;
    }
    case 'APPROVE_TASK': {
      const task = state.tasks.find(t => t.id === action.payload);
      return {
        ...state, tasks: state.tasks.map(t => t.id === action.payload ? { ...t, status: 'DONE' } : t),
        pointsLedger: [...state.pointsLedger, { id: Math.random().toString(), userId: task.assignedToUserId, amount: task.points, reason: `Approved: ${task.title}`, createdAt: new Date().toISOString() }]
      };
    }
    case 'REDEEM_REWARD': return { ...state, pointsLedger: [...state.pointsLedger, { id: Math.random().toString(), userId: action.payload.userId, amount: -action.payload.cost, reason: `Redeemed: ${action.payload.title}`, createdAt: new Date().toISOString() }] };
    case 'INCREMENT_AI': return { ...state, usageCounters: state.usageCounters.map(c => c.familyId === state.family.id ? { ...c, aiActionsUsed: c.aiActionsUsed + 1 } : c ) };
    case 'ADD_MESSAGE': return { ...state, messages: [...state.messages, action.payload] };
    case 'APPROVE_EVENT': return { ...state, events: state.events.map(e => e.id === action.payload ? { ...e, status: 'ACTIVE' } : e) };
    case 'CREATE_TASK': return { ...state, tasks: [...state.tasks, { ...action.payload, id: Math.random().toString(), status: 'TODO', createdAt: new Date().toISOString() }] };
    case 'CREATE_REWARD': return { ...state, rewards: [...state.rewards, { ...action.payload, id: Math.random().toString(), familyId: state.family.id, active: true }] };
    case 'CREATE_EVENT': return { ...state, events: [...state.events, { ...action.payload, id: Math.random().toString(), status: 'ACTIVE' }] };
    case 'GENERATE_AI_PLAN': return { ...state, tasks: [...state.tasks, ...action.payload], usageCounters: state.usageCounters.map(c => c.familyId === state.family.id ? { ...c, aiActionsUsed: c.aiActionsUsed + 1 } : c ) };
    case 'DELETE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'DELETE_EVENT': return { ...state, events: state.events.filter(e => e.id !== action.payload) };
    case 'DELETE_REWARD': return { ...state, rewards: state.rewards.filter(r => r.id !== action.payload) };
    case 'ADD_MEMBER': {
      const newMember = action.payload;
      const newPoints = newMember.role !== 'PARENT' ? [{ id: Math.random().toString(), userId: newMember.id, amount: 100, reason: 'Welcome Bonus', createdAt: new Date().toISOString() }] : [];
      return { ...state, users: [...state.users, newMember], pointsLedger: [...state.pointsLedger, ...newPoints] };
    }
    case 'AWARD_POINTS': return { ...state, pointsLedger: [...state.pointsLedger, { id: Math.random().toString(), userId: action.payload.userId, amount: action.payload.amount, reason: action.payload.reason, createdAt: new Date().toISOString() }] };
    case 'COMPLETE_ALL_TASKS': return { ...state, tasks: state.tasks.map(t => ({ ...t, status: 'DONE' })) };
    case 'ADD_RECIPE': return { ...state, recipes: [...state.recipes, action.payload] };
    case 'DELETE_RECIPE': return { ...state, recipes: state.recipes.filter(r => r.id !== action.payload), mealPlan: state.mealPlan.filter(m => m.recipeId !== action.payload) };
    case 'ADD_TO_MEAL_PLAN': return { ...state, mealPlan: [...state.mealPlan.filter(m => m.date !== action.payload.date), action.payload] };
    case 'REMOVE_FROM_MEAL_PLAN': return { ...state, mealPlan: state.mealPlan.filter(m => m.id !== action.payload) };
    case 'ADD_SHOPPING_ITEM': return { ...state, shoppingList: [{ id: Math.random().toString(), name: action.payload, isChecked: false }, ...state.shoppingList] };
    case 'TOGGLE_SHOPPING_ITEM': return { ...state, shoppingList: state.shoppingList.map(item => item.id === action.payload ? { ...item, isChecked: !item.isChecked } : item ) };
    case 'CLEAR_COMPLETED_SHOPPING': return { ...state, shoppingList: state.shoppingList.filter(item => !item.isChecked) };
    case 'ADD_MULTIPLE_SHOPPING_ITEMS': return { ...state, shoppingList: [...action.payload, ...state.shoppingList] };
    default: return state;
  }
}

const AppContext = createContext();

const getEntitlements = (plan) => ({
  aiActionsMonthly: plan === 'FREE' ? 20 : plan === 'PLUS' ? 300 : Infinity,
  calendarSyncRead: ['PLUS', 'PRO'].includes(plan),
  calendarSyncWrite: plan === 'PRO',
  automations: plan === 'PRO',
  templatesPack: plan === 'FREE' ? 'starter' : plan === 'PLUS' ? 'standard' : 'pro',
  advancedReminders: ['PLUS', 'PRO'].includes(plan),
  analytics: plan === 'FREE' ? 'none' : plan === 'PLUS' ? 'basic' : 'advanced',
  copilot: plan === 'PRO'
});

// --- UI COMPONENTS ---
const PremiumGate = ({ feature, children, fallback }) => {
  const { entitlements } = useContext(AppContext);
  const isAllowed = typeof entitlements[feature] === 'number' ? true : !!entitlements[feature]; 
  if (!isAllowed && fallback) return fallback;
  if (!isAllowed) return null;
  return children;
};

const Card = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 p-5 transition-all duration-400 ${onClick ? 'cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 active:scale-[0.98]' : ''} ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "w-full font-bold rounded-2xl py-3.5 px-4 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2 relative overflow-hidden group";
  const variants = {
    primary: "bg-indigo-600 text-white shadow-[0_4px_20px_-4px_rgba(79,70,229,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-indigo-500 hover:shadow-[0_8px_25px_-5px_rgba(79,70,229,0.5)]",
    secondary: "bg-slate-100/80 backdrop-blur-sm text-slate-700 hover:bg-slate-200/80 ring-1 ring-slate-900/5",
    premium: "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-[0_4px_20px_-4px_rgba(139,92,246,0.4)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_25px_-5px_rgba(139,92,246,0.5)] hover:scale-[1.02]",
    outline: "border-2 border-slate-200/50 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      <div className="relative z-10 flex items-center justify-center gap-2">{children}</div>
      <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out pointer-events-none rounded-2xl" style={{ mixBlendMode: 'overlay' }}></div>
    </button>
  );
};

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: "bg-slate-100/80 backdrop-blur-sm text-slate-700 ring-1 ring-slate-900/5",
    success: "bg-emerald-100/80 backdrop-blur-sm text-emerald-700 ring-1 ring-emerald-900/5",
    warning: "bg-amber-100/80 backdrop-blur-sm text-amber-700 ring-1 ring-amber-900/5",
    premium: "bg-violet-100/80 backdrop-blur-sm text-violet-700 ring-1 ring-violet-900/5",
    fire: "bg-orange-100/80 backdrop-blur-sm text-orange-600 ring-1 ring-orange-900/5"
  };
  return (
    <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
};

// --- INTERACTIVE MODAL COMPONENT ---
const Modal = ({ isOpen, onClose, title, children, fullHeight = false }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className={`bg-white/95 backdrop-blur-2xl w-full sm:w-[90%] max-w-md ${fullHeight ? 'h-[95%]' : 'max-h-[90%]'} sm:h-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl shadow-indigo-900/10 flex flex-col animate-in slide-in-from-bottom-12 sm:zoom-in-95 duration-400 ring-1 ring-slate-900/5 relative cursor-default`}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden opacity-60"></div>
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 bg-slate-100/80 backdrop-blur-sm rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all hover:rotate-90 duration-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar pb-8 relative">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- STRIPE CHECKOUT MODAL (Mock) ---
const StripeCheckoutModal = ({ isOpen, onClose }) => {
  const { dispatch, showToast } = useContext(AppContext);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      dispatch({ type: 'CHANGE_PLAN', payload: 'PRO' });
      showToast('Payment successful! Welcome to PRO.', 'success', 'FamilyOS PRO');
      onClose();
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<span className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-slate-700"/> Secure Checkout</span>}>
      <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
          <Zap className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-white/5 pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-bold text-lg">FamilyOS PRO</h3>
            <p className="text-slate-400 text-sm">Monthly Subscription</p>
          </div>
          <div className="relative z-10 text-right">
            <h3 className="font-extrabold text-2xl">$9.99</h3>
            <p className="text-slate-400 text-xs">/month</p>
          </div>
        </div>
        <form onSubmit={handleSubscribe} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <input required type="email" defaultValue="parent@family.com" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 shadow-sm transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Card Information</label>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <input required type="text" placeholder="Card number (Mock)" className="w-full border-b border-slate-100 px-4 py-3 text-sm focus:outline-none focus:bg-slate-50" defaultValue="4242 4242 4242 4242" />
              <div className="flex">
                <input required type="text" placeholder="MM / YY" className="w-1/2 border-r border-slate-100 px-4 py-3 text-sm focus:outline-none focus:bg-slate-50" defaultValue="12 / 26" />
                <input required type="text" placeholder="CVC" className="w-1/2 px-4 py-3 text-sm focus:outline-none focus:bg-slate-50" defaultValue="123" />
              </div>
            </div>
          </div>
          <div className="pt-4">
            <button 
              disabled={isProcessing}
              type="submit" 
              className="w-full bg-[#0a2540] hover:bg-[#0f355c] text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all active:scale-[0.98] hover:-translate-y-1 hover:shadow-xl disabled:opacity-70 disabled:hover:translate-y-0 shadow-lg"
            >
              {isProcessing ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                 <><Lock className="w-4 h-4"/> Pay $9.99</>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 font-medium flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3"/> Secured by Stripe (Mock UI)
            </p>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// --- COPILOT AI ASSISTANT MODAL ---
const CopilotModal = ({ isOpen, onClose }) => {
  const { state, dispatch, entitlements, showToast } = useContext(AppContext);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm your FamilyOS Copilot. Try asking me to 'Complete all tasks' or 'Give Daisy 50 points'!" }
  ]);
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef(null);
  
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    
    setTimeout(() => {
      if (!entitlements.copilot) {
        setMessages(prev => [...prev, { 
          role: 'ai', isUpsell: true,
          text: "Executing commands is a feature of FamilyOS PRO! Upgrade to unlock the full conversational AI to auto-schedule your family's life, balance chore loads fairly, and update the database." 
        }]);
      } else {
        const lowerInput = userMessage.toLowerCase();
        let handled = false;

        if (lowerInput.includes('complete') || lowerInput.includes('finish') || lowerInput.includes('clear')) {
          dispatch({ type: 'COMPLETE_ALL_TASKS' });
          showToast('Database updated: All tasks completed!', 'success', 'Copilot Action');
          setMessages(prev => [...prev, { role: 'ai', text: "Done! I've accessed the database and marked all pending tasks as complete." }]);
          handled = true;
        } else if (lowerInput.includes('give') || lowerInput.includes('point') || lowerInput.includes('award')) {
          const kids = state.users.filter(u => u.role !== 'PARENT');
          if (kids.length > 0) {
            const targetKid = kids[0]; 
            dispatch({ type: 'AWARD_POINTS', payload: { userId: targetKid.id, amount: 50, reason: 'Copilot Bonus' } });
            showToast(`Deposited 50 pts to ${targetKid.name}`, 'success', 'Copilot Action');
            setMessages(prev => [...prev, { role: 'ai', text: `I've successfully deposited 50 bonus points directly into ${targetKid.name}'s ledger!` }]);
            handled = true;
          }
        }
        if (!handled) {
          setMessages(prev => [...prev, { role: 'ai', text: "I can certainly analyze that for you! (For this demo, try asking me to 'complete all tasks' or 'give points' to see my live database capabilities!)" }]);
        }
      }
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<span className="flex items-center gap-2 text-violet-700"><Sparkles className="w-5 h-5"/> Family Copilot</span>} fullHeight>
      <div className="flex flex-col h-full relative">
        <div className="flex-1 overflow-y-auto space-y-4 pb-24">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : msg.isUpsell 
                    ? 'bg-gradient-to-r from-violet-100 to-indigo-100 border border-violet-200 text-violet-900 rounded-bl-none'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
              }`}>
                {msg.text}
                {msg.isUpsell && (
                  <Button variant="premium" className="mt-4 py-2 text-xs" onClick={() => {
                     dispatch({ type: 'CHANGE_PLAN', payload: 'PRO' });
                     showToast("Upgraded to PRO!", "success");
                  }}>
                    Unlock PRO Copilot <Zap className="w-4 h-4"/>
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>
        <form onSubmit={handleSend} className="absolute bottom-0 left-0 right-0 bg-white pt-3 border-t border-slate-100 flex gap-2">
          <input 
            type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask me to schedule a dinner..." 
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
          <button type="submit" disabled={!input.trim()} className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl disabled:opacity-50 transition-all active:scale-95 hover:shadow-lg">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </Modal>
  );
};

// --- ONBOARDING SCREENS & ANIMATIONS ---
const CustomStyles = () => (
  <style>{`
    @keyframes float {
      0% { transform: translateY(0px) rotate(var(--rot, 0deg)); }
      50% { transform: translateY(-12px) rotate(var(--rot, 0deg)); }
      100% { transform: translateY(0px) rotate(var(--rot, 0deg)); }
    }
    .animate-float {
      animation: float 4s ease-in-out infinite;
    }
    @keyframes revealUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-reveal {
      animation: revealUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes shimmer { 100% { transform: translateX(100%); } }
    
    /* Splash Screen Animations */
    @keyframes blobBounce {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob { animation: blobBounce 7s infinite; }
    .animation-delay-2000 { animation-delay: 2s; }
    .animation-delay-4000 { animation-delay: 4s; }

    /* Custom Checkbox Pop */
    @keyframes checkPop {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    .animate-check-pop { animation: checkPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  `}</style>
);

// 1. Role Selection Screen
const RoleSelectionScreen = ({ onNext }) => {
  const [selectedRole, setSelectedRole] = useState('PARENT');

  const roles = [
    { id: 'PARENT', title: 'Parent', desc: 'Family admin & oversight', icon: Crown },
    { id: 'TEEN', title: 'Teen', desc: 'More independence', icon: User },
    { id: 'CHILD', title: 'Child', desc: 'Age-appropriate', icon: Smile },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden items-center text-center pt-16 animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-[#7c3aed] rounded-[1.5rem] flex items-center justify-center text-white mb-6 shadow-md shadow-violet-200 animate-float">
        <Users className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Welcome to FamilyOS</h1>
      <p className="text-slate-500 text-sm px-8 mb-8 font-medium">Less nagging, more clarity. Let's set up your family command center.</p>

      <div className="flex flex-col gap-3 w-full px-6 max-w-sm">
        {roles.map(r => {
          const isSelected = selectedRole === r.id;
          const Icon = r.icon;
          return (
            <div 
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md ${isSelected ? 'border-[#7c3aed] bg-[#7c3aed]/5 shadow-sm' : 'border-slate-200 bg-white'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300 ${isSelected ? 'bg-[#7c3aed] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-[#0f172a] text-lg leading-tight mb-0.5">{r.title}</h3>
                <p className="text-[13px] text-slate-500">{r.desc}</p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 bg-[#7c3aed] rounded-full flex items-center justify-center text-white animate-in zoom-in duration-200 shadow-sm">
                   <Check className="w-4 h-4 animate-check-pop" strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 w-full p-6 flex justify-end">
        <Button onClick={() => onNext(selectedRole)} className="bg-[#7c3aed] hover:bg-violet-700 shadow-lg shadow-violet-600/30">
          Continue <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

// 2. Family Setup Builder Screen
const FamilySetupScreen = ({ initialRole, onBack, onNext }) => {
  const [familyName, setFamilyName] = useState('');
  const [members, setMembers] = useState([{ id: 'u1', name: '', role: initialRole, isMe: true, avatar: initialRole === 'PARENT' ? '👱‍♂️' : '👦' }]);
  const isValid = familyName.trim() !== '' && members.every(m => m.name.trim() !== '');
  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Create Your Family</h1>
        <p className="text-slate-500 text-sm mb-8 font-medium">Add your family members.</p>
        <div className="mb-6">
          <label className="block text-sm font-bold text-[#334155] mb-2">Family Name</label>
          <input type="text" value={familyName} onChange={e => setFamilyName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/50 shadow-sm transition-all" placeholder="The Smiths" />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-bold text-[#334155] mb-2">Family Members</label>
          <div className="space-y-4">
            {members.map((member, idx) => (
              <div key={member.id} className="relative bg-white border border-slate-200 rounded-3xl p-4 shadow-sm hover:shadow-md transition-shadow">
                {member.isMe && <div className="absolute -top-3 -right-2 bg-[#9333ea] text-white text-[10px] font-extrabold px-3 py-1 rounded-full border-2 border-white z-10 tracking-wider shadow-sm">YOU</div>}
                <div className="flex items-center gap-4">
                   <div className="text-4xl bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 cursor-pointer hover:scale-110 transition-transform">{member.avatar}</div>
                   <div className="flex-1 space-y-3">
                      <input type="text" value={member.name} onChange={e => setMembers(members.map(m => m.id === member.id ? { ...m, name: e.target.value } : m))} placeholder={member.isMe ? "Your name" : "Member name"} className="w-full bg-transparent border-b-2 border-slate-100 px-1 py-1 text-sm focus:outline-none focus:border-[#7c3aed] transition-colors" />
                      <div className="flex gap-2">
                         {['PARENT', 'TEEN', 'CHILD'].map(r => (
                            <button key={r} onClick={() => setMembers(members.map(m => m.id === member.id ? { ...m, role: r } : m))} className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${member.role === r ? 'bg-[#a855f7] text-white shadow-md scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:scale-105'}`}>{r.charAt(0) + r.slice(1).toLowerCase()}</button>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setMembers([...members, { id: 'u' + Math.random().toString(36).substr(2, 9), name: '', role: 'CHILD', isMe: false, avatar: ['👨', '👩', '👦', '👧', '👶'][members.length % 5] }])} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#7c3aed] transition-colors py-2 group"><Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Add Family Member</button>
      </div>
      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-white via-white to-white/0 flex justify-between items-center">
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors hover:-translate-x-1"><ChevronLeft className="w-4 h-4" /> Back</button>
        <button disabled={!isValid} className="bg-[#a855f7] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/30 active:scale-95 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0" onClick={() => onNext({ familyName, members })}>Continue <ChevronRight className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

// 3. Choose Your Week Style Screen
const WeekStyleScreen = ({ onBack, onNext }) => {
  const [selectedStyle, setSelectedStyle] = useState('BALANCED');

  const styles = [
    { id: 'LIGHT', title: 'Light', desc: 'Minimal reminders, more freedom', icon: Sun, iconBg: 'bg-[#f59e0b]' },
    { id: 'BALANCED', title: 'Balanced', desc: 'Moderate structure', icon: Zap, iconBg: 'bg-[#7c3aed]' },
    { id: 'STRUCTURED', title: 'Structured', desc: 'Full organization', icon: CalendarIcon, iconBg: 'bg-[#10b981]' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar mt-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Choose Your Week Style</h1>
        <p className="text-slate-500 text-[15px] mb-8 font-medium">This affects how many reminders you get and dashboard density.</p>

        <div className="flex flex-col gap-4 w-full">
          {styles.map(s => {
            const isSelected = selectedStyle === s.id;
            const Icon = s.icon;
            return (
              <div 
                key={s.id}
                onClick={() => setSelectedStyle(s.id)}
                className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md ${isSelected ? 'border-[#7c3aed] bg-[#7c3aed]/5 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${s.iconBg} text-white shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-[#0f172a] text-[15px] leading-tight mb-0.5">{s.title}</h3>
                  <p className="text-[13px] text-slate-500">{s.desc}</p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-[#7c3aed] rounded-full flex items-center justify-center text-white animate-in zoom-in duration-200 shadow-sm">
                     <Check className="w-4 h-4 animate-check-pop" strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-[#f8fafc]/0 flex justify-between items-center">
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors hover:-translate-x-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:-translate-y-1 active:scale-95 transition-all" 
          onClick={() => onNext(selectedStyle)}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// 4. Connect Calendars Screen
const CalendarSyncScreen = ({ onBack, onNext }) => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const isFree = state.family.plan === 'FREE';

  const handleLearnMore = () => {
    dispatch({ type: 'CHANGE_PLAN', payload: 'PLUS' });
    showToast('Upgraded to PLUS Plan! Calendars unlocked.', 'success');
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar mt-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Connect Calendars</h1>
        <p className="text-slate-500 text-[15px] mb-8 font-medium">Sync family calendars to see everyone's schedule in one place.</p>

        {isFree ? (
          <div className="bg-[#f8f9ff] border border-slate-200 rounded-3xl p-5 flex gap-4 shadow-sm mb-6 transition-all hover:shadow-md">
             <div className="w-14 h-14 bg-[#7c3aed] rounded-2xl flex items-center justify-center shrink-0 text-white shadow-md">
                <Lock className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-bold text-[#0f172a] mb-1.5 text-[15px]">Calendar Sync (Plus Plan)</h3>
                <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">Upgrade to Plus to connect Google Calendar, Outlook, and Apple Calendar.</p>
                <button onClick={handleLearnMore} className="bg-[#7c3aed] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-purple-500/20 active:scale-95 hover:-translate-y-0.5 transition-all">
                  Learn More
                </button>
             </div>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
             {['Google Calendar', 'Outlook', 'Apple Calendar'].map((cal, i) => (
               <div key={cal} className="border border-slate-200 bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${i===0 ? 'bg-red-50 text-red-600' : i===1 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-700'}`}>
                        <CalendarIcon className="w-6 h-6"/>
                     </div>
                     <span className="font-bold text-[#0f172a]">{cal}</span>
                  </div>
                  <button className="text-[#7c3aed] font-bold text-sm bg-[#7c3aed]/10 px-5 py-2 rounded-xl active:scale-95 transition-all hover:bg-[#7c3aed]/20">Connect</button>
               </div>
             ))}
          </div>
        )}

        <p className="text-center text-[13px] text-slate-400 font-medium">You can skip this step and set up calendars later in Settings.</p>
      </div>

      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-[#f8fafc]/0 flex justify-between items-center">
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors hover:-translate-x-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:-translate-y-1 active:scale-95 transition-all" 
          onClick={() => onNext()}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// 5. Choose Task Templates Screen
const TaskTemplatesScreen = ({ onBack, onNext }) => {
  const [selectedTasks, setSelectedTasks] = useState(new Set(['c1', 'c2', 'c3', 'h1', 'h3']));

  const chores = [
    { id: 'c1', title: 'Make bed', points: 5, type: 'CHORE' },
    { id: 'c2', title: 'Clean room', points: 15, type: 'CHORE' },
    { id: 'c3', title: 'Take out trash', points: 10, type: 'CHORE' },
    { id: 'c4', title: 'Do dishes', points: 10, type: 'CHORE' },
    { id: 'c5', title: 'Feed pet', points: 5, type: 'CHORE' },
    { id: 'c6', title: 'Vacuum', points: 15, type: 'CHORE' },
  ];

  const homework = [
    { id: 'h1', title: 'Complete homework', points: 20, type: 'HOMEWORK' },
    { id: 'h2', title: 'Practice instrument', points: 15, type: 'HOMEWORK' },
    { id: 'h3', title: 'Read 30 minutes', points: 10, type: 'HOMEWORK' },
    { id: 'h4', title: 'Study for test', points: 25, type: 'HOMEWORK' },
  ];

  const toggleTask = (id) => {
    const newSet = new Set(selectedTasks);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTasks(newSet);
  };

  const handleContinue = () => {
    const allTemplates = [...chores, ...homework];
    const tasksToAdd = allTemplates.filter(t => selectedTasks.has(t.id));
    onNext(tasksToAdd);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar mt-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Choose Task Templates</h1>
        <p className="text-slate-500 text-[15px] mb-6 font-medium">Select common chores and homework tasks to get started quickly.</p>

        {/* Chores Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-[#334155]">
            <Home className="w-4 h-4" />
            <h2 className="font-bold text-[15px]">Chores</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {chores.map(task => {
              const isSelected = selectedTasks.has(task.id);
              return (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id)}
                  className={`border-2 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all active:scale-[0.98] ${
                    isSelected ? 'border-amber-400 bg-white' : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-300'
                  }`}>
                    {isSelected ? <Check className="w-4 h-4 animate-check-pop" strokeWidth={3} /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className={`text-[13px] leading-tight mb-0.5 ${isSelected ? 'font-bold text-[#0f172a]' : 'font-semibold text-slate-700'}`}>
                      {task.title}
                    </h3>
                    <p className="text-[11px] font-medium text-[#8b5cf6]">{task.points} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Homework Section */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-[#334155]">
            <BookOpen className="w-4 h-4" />
            <h2 className="font-bold text-[15px]">Homework</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {homework.map(task => {
              const isSelected = selectedTasks.has(task.id);
              return (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id)}
                  className={`border-2 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all active:scale-[0.98] ${
                    isSelected ? 'border-sky-400 bg-white' : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-sky-400 text-white' : 'bg-slate-100 text-slate-300'
                  }`}>
                    {isSelected ? <Check className="w-4 h-4 animate-check-pop" strokeWidth={3} /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className={`text-[13px] leading-tight mb-0.5 ${isSelected ? 'font-bold text-[#0f172a]' : 'font-semibold text-slate-700'}`}>
                      {task.title}
                    </h3>
                    <p className="text-[11px] font-medium text-[#8b5cf6]">{task.points} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-[#f8fafc]/0 flex justify-between items-center">
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors hover:-translate-x-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:-translate-y-1 active:scale-95 transition-all" 
          onClick={handleContinue}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// 6. Set Up Rewards Screen
const RewardTemplatesScreen = ({ onBack, onNext }) => {
  const [selectedRewards, setSelectedRewards] = useState(new Set(['r1', 'r3', 'r4']));

  const rewardOptions = [
    { id: 'r1', icon: '📱', title: '30 min Screen Time', points: 30 },
    { id: 'r2', icon: '🎮', title: '1 hour Screen Time', points: 50 },
    { id: 'r3', icon: '💵', title: '$5 Allowance', points: 100 },
    { id: 'r4', icon: '🎬', title: 'Movie Night Pick', points: 75 },
    { id: 'r5', icon: '🌙', title: 'Stay Up Late', points: 40 },
    { id: 'r6', icon: '🍕', title: 'Pizza Night', points: 80 },
  ];

  const toggleReward = (id) => {
    const newSet = new Set(selectedRewards);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRewards(newSet);
  };

  const handleContinue = () => {
    const selected = rewardOptions.filter(r => selectedRewards.has(r.id));
    onNext(selected);
  };

  const isValid = selectedRewards.size >= 3;

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar mt-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Set Up Rewards</h1>
        <p className="text-slate-500 text-[15px] mb-6 font-medium">Choose at least 3 rewards your family can work towards.</p>

        <div className="flex flex-col gap-3">
          {rewardOptions.map(reward => {
            const isSelected = selectedRewards.has(reward.id);
            return (
              <div
                key={reward.id}
                onClick={() => toggleReward(reward.id)}
                className={`border-2 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all active:scale-[0.98] ${
                  isSelected ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl w-8 text-center">{reward.icon}</div>
                  <div>
                    <h3 className={`text-[15px] leading-tight mb-0.5 ${isSelected ? 'font-bold text-[#0f172a]' : 'font-semibold text-slate-700'}`}>
                      {reward.title}
                    </h3>
                    <p className="text-[13px] font-medium text-[#8b5cf6]">{reward.points} points</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'bg-emerald-400 text-white' : 'bg-slate-100 text-slate-300'
                }`}>
                  {isSelected ? <Check className="w-4 h-4 animate-check-pop" strokeWidth={3} /> : <Plus className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-[#f8fafc]/0 flex justify-between items-center">
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors hover:-translate-x-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          disabled={!isValid}
          className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
          onClick={handleContinue}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// 7. Notification Preferences Screen
const NotificationPrefsScreen = ({ onBack, onNext }) => {
  const [quietFrom, setQuietFrom] = useState('21:00'); // 9:00 PM
  const [quietTo, setQuietTo] = useState('07:00'); // 7:00 AM
  const [intensity, setIntensity] = useState('GENTLE'); // GENTLE, MODERATE, FREQUENT

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar mt-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Notification Preferences</h1>
        <p className="text-slate-500 text-[15px] mb-8 font-medium">Set quiet hours and reminder frequency.</p>

        {/* Quiet Hours Box */}
        <div className="bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-3xl p-5 mb-8 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-indigo-50/80 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0f172a] text-[15px] leading-tight mb-0.5">Quiet Hours</h3>
              <p className="text-[13px] text-slate-500">No notifications during these times</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 mb-2 ml-1">From</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={quietFrom}
                  onChange={e => setQuietFrom(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[#0f172a] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all font-medium hover:border-indigo-300"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 mb-2 ml-1">To</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={quietTo}
                  onChange={e => setQuietTo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[#0f172a] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all font-medium hover:border-indigo-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reminder Intensity */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-[#334155]">
            <Bell className="w-4 h-4" />
            <h2 className="font-bold text-[15px]">Reminder Intensity</h2>
          </div>
          <div className="flex gap-3">
            {['GENTLE', 'MODERATE', 'FREQUENT'].map(level => {
              const isSelected = intensity === level;
              return (
                <button
                  key={level}
                  onClick={() => setIntensity(level)}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-[13px] transition-all border-2 hover:-translate-y-1 hover:shadow-sm ${
                    isSelected 
                      ? 'border-[#7c3aed] text-[#7c3aed] bg-white shadow-sm' 
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-[#f8fafc]/0 flex justify-between items-center">
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors hover:-translate-x-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:-translate-y-1 active:scale-95 transition-all" 
          onClick={() => onNext({ quietHoursFrom: quietFrom, quietHoursTo: quietTo, reminderIntensity: intensity })}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const AllSetScreen = ({ onBack, onFinish }) => {
  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden animate-in fade-in duration-500 items-center justify-center text-center p-6">
      <div className="w-24 h-24 bg-emerald-400 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-400/50 animate-bounce">
        <Check className="w-12 h-12" strokeWidth={4} />
      </div>
      <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">You're All Set! 🎉</h1>
      <p className="text-slate-500 text-[15px] mb-12 font-medium">Welcome to your new command center.</p>
      <Button onClick={onFinish} className="bg-slate-900 hover:bg-slate-800 shadow-xl py-4 text-lg animate-in slide-in-from-bottom-8 delay-300">
        <Sparkles className="w-5 h-5 text-yellow-400" /> Enter FamilyOS
      </Button>
    </div>
  );
};

const Dashboard = () => {
  const { state, currentUser, userPoints, dispatch, usageCount, entitlements, showToast } = useContext(AppContext);
  const [isGenerating, setIsGenerating] = useState(false);
  const isParent = currentUser?.role === 'PARENT';

  const myTasks = state.tasks.filter(t => t.assignedToUserId === currentUser?.id && t.status !== 'DONE');
  const needsApproval = state.tasks.filter(t => t.status === 'NEEDS_APPROVAL');
  const pendingEvents = state.events.filter(e => e.status === 'PENDING_APPROVAL');
  const activeTasksCount = state.tasks.filter(t => t.status !== 'DONE').length;
  const todayEventsCount = state.events.length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const GreetingIcon = hour < 12 ? Sunrise : hour < 18 ? Sun : Sunset;
  
  const handleGeneratePlan = async () => {
    if (usageCount >= entitlements.aiActionsMonthly) { showToast("AI limit reached for your plan.", "error"); return; }
    const kids = state.users.filter(u => u.role !== 'PARENT');
    if (kids.length === 0) { showToast("No kids available to assign tasks to!", "error"); return; }
    setIsGenerating(true);
    try {
      const kidsContext = kids.map(k => `ID: ${k.id}, Name: ${k.name}`).join('\n');
      const aiResponse = await generateSmartPlan(kidsContext);
      if (aiResponse && aiResponse.tasks) {
        const aiTasks = aiResponse.tasks.map(t => ({ ...t, id: Math.random().toString(), familyId: state.family.id, status: 'TODO', dueAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date().toISOString() }));
        dispatch({ type: 'GENERATE_AI_PLAN', payload: aiTasks });
        showToast("Smart routine generated!", "success");
      }
    } catch (error) { showToast("Failed to generate AI plan.", "error"); } finally { setIsGenerating(false); }
  };

  return (
    <div className="p-4 sm:p-6 pb-32 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-start">
        <div>
          <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <GreetingIcon className="w-4 h-4"/> Today
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight transition-all">
            {greeting},<br/>{currentUser?.name.split(' ')[0]}
          </h1>
        </div>
        <div className="relative cursor-pointer hover:scale-105 active:scale-95 transition-all group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
          <div className="relative w-14 h-14 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm border-2 border-white ring-1 ring-slate-100/50">{currentUser?.avatar || '👤'}</div>
          {isParent && needsApproval.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-[2px] border-white rounded-full animate-pulse shadow-sm"></span>}
        </div>
      </header>

      {isParent && (
        <div className="grid grid-cols-2 gap-4">
           <PremiumGate feature="automations" fallback={
             <Card className="col-span-2 bg-slate-50 border-dashed flex flex-col items-center justify-center py-8 text-center" onClick={() => dispatch({ type: 'CHANGE_PLAN', payload: 'PRO' })}>
               <div className="bg-white p-3 rounded-2xl shadow-sm mb-3"><BrainCircuit className="w-6 h-6 text-slate-400" /></div>
               <h3 className="font-bold text-slate-900 text-[15px]">AI Daily Planning</h3>
               <p className="text-[13px] text-slate-500 mb-4 px-6">Upgrade to PRO to auto-assign chores.</p>
               <Button variant="outline" className="w-auto py-2 px-6">Upgrade</Button>
             </Card>
           }>
             <div className="col-span-2 relative group cursor-pointer" onClick={isGenerating ? undefined : handleGeneratePlan}>
               <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
               <Card className="relative bg-white shadow-xl overflow-hidden p-5 flex items-center gap-5">
                 <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl shadow-inner flex items-center justify-center shrink-0 transition-transform group-hover:rotate-12 group-hover:scale-110 duration-300">
                   {isGenerating ? <Loader2 className="w-7 h-7 animate-spin" /> : <Sparkles className="w-7 h-7" />}
                 </div>
                 <div className="flex-1">
                   <h4 className="font-black text-slate-900 text-lg tracking-tight">Auto-Generate Plan</h4>
                   <p className="text-xs text-slate-500 font-medium">Instantly assign smart tasks</p>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
               </Card>
             </div>
           </PremiumGate>
        </div>
      )}

      {/* Task List with Interactive Empty States */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{isParent ? 'Family Focus' : 'My Tasks'}</h2>
        </div>
        
        <div className="space-y-3">
          {(isParent ? state.tasks.filter(t => t.status !== 'DONE') : myTasks).slice(0, 4).map(task => {
            const kid = state.users.find(u => u.id === task.assignedToUserId);
            const isChore = task.type === 'CHORE';
            return (
              <Card key={task.id} className={`flex items-center gap-4 border-l-4 ${isChore ? 'border-l-emerald-400' : 'border-l-sky-400'}`}>
                <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 shadow-inner ${isChore ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                  {isChore ? <CheckSquare className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#0f172a] text-[15px] truncate mb-0.5">{task.title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={isChore ? 'success' : 'premium'}>{task.points} pts</Badge>
                    {isParent && <span className="text-[12px] font-semibold text-slate-500 truncate flex items-center gap-1"><UserCircle className="w-3 h-3"/>{kid?.name.split(' ')[0]}</span>}
                  </div>
                </div>
                {!isParent && task.status === 'TODO' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'COMPLETE_TASK', payload: task.id }); showToast(`Completed! Earned ${task.points} points.`, 'success'); }}
                    className={`group w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isChore ? 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-500' : 'border-slate-200 hover:border-sky-500 hover:bg-sky-500'}`}
                  >
                    <Check className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors group-hover:scale-110" strokeWidth={3} />
                  </button>
                )}
                {isParent && task.status === 'NEEDS_APPROVAL' && (
                   <Button variant="primary" className="w-auto px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-600" onClick={() => { dispatch({ type: 'APPROVE_TASK', payload: task.id }); showToast('Approved!', 'success'); }}>Approve</Button>
                )}
              </Card>
            )
          })}

          {/* Interactive Empty State */}
          {(!isParent && myTasks.length === 0) && (
            <Card className="text-center py-10 border-dashed border-2 border-slate-200 bg-transparent flex flex-col items-center justify-center cursor-default hover:shadow-none hover:translate-y-0">
               <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3 animate-bounce">
                 <Trophy className="w-8 h-8 text-emerald-600" />
               </div>
               <h3 className="font-black text-slate-900 text-lg mb-1">All Caught Up!</h3>
               <p className="text-[13px] font-medium text-slate-500 mb-4">You've crushed all your tasks for today.</p>
               <Button variant="outline" className="w-auto px-6 text-xs" onClick={() => dispatch({ type: 'CHANGE_TAB', payload: 'rewards' })}>Go Spend Points</Button>
            </Card>
          )}
          {(isParent && state.tasks.filter(t => t.status !== 'DONE').length === 0) && (
             <Card className="text-center py-10 border-dashed border-2 border-slate-200 bg-transparent flex flex-col items-center justify-center hover:bg-slate-50 transition-colors" onClick={() => dispatch({ type: 'CHANGE_TAB', payload: 'tasks' })}>
               <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400"><Plus className="w-6 h-6"/></div>
               <h3 className="font-bold text-slate-700">No active tasks</h3>
               <p className="text-[13px] text-slate-500 mt-1 mb-4">Assign chores manually or use AI.</p>
               <Button variant="secondary" className="w-auto px-6 text-xs pointer-events-none">Create Task</Button>
             </Card>
          )}
        </div>
      </section>
    </div>
  );
};

const TasksView = () => {
  const { state, currentUser, dispatch, showToast } = useContext(AppContext);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setModalOpen] = useState(false);
  const isParent = currentUser?.role === 'PARENT';

  const [newTask, setNewTask] = useState({ title: '', points: 50, assignedToUserId: state.users.find(u => u.role !== 'PARENT')?.id || '', type: 'CHORE', proofRequired: true });

  const displayTasks = state.tasks.filter(t => {
    const userMatch = isParent ? true : t.assignedToUserId === currentUser?.id;
    const statusMatch = statusFilter === 'ALL' ? true : t.status === statusFilter;
    return userMatch && statusMatch;
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    dispatch({ type: 'CREATE_TASK', payload: { ...newTask, familyId: state.family.id, dueAt: new Date(Date.now() + 86400000).toISOString() } });
    setModalOpen(false);
    setNewTask({ ...newTask, title: '' }); 
    showToast('Task successfully created!');
  };

  const filterTabs = [{ id: 'ALL', label: 'All' }, { id: 'TODO', label: 'To Do' }, { id: 'IN_PROGRESS', label: 'Active' }, { id: 'NEEDS_APPROVAL', label: 'Review' }, { id: 'DONE', label: 'Done' }];

  return (
    <div className="p-4 pb-24 h-full flex flex-col relative animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tasks</h1>
      
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar shrink-0 pb-2">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-md scale-105'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:scale-105'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
        {displayTasks.map(task => (
          <Card key={task.id} className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={task.type === 'CHORE' ? 'default' : task.type === 'HOMEWORK' ? 'premium' : 'warning'}>{task.type}</Badge>
                {task.status === 'NEEDS_APPROVAL' && <Badge variant="warning">Review</Badge>}
                {task.status === 'IN_PROGRESS' && <Badge variant="success">Active</Badge>}
                {task.status === 'DONE' && <Badge variant="success">Done</Badge>}
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">{task.title}</h4>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Due Today • {task.points} pts
                {isParent && ` • ${state.users.find(u => u.id === task.assignedToUserId)?.name.split(' ')[0]}`}
              </p>
            </div>
            
            <div className="flex flex-col gap-2 shrink-0">
              {!isParent && task.status === 'TODO' && (
                <>
                  <Button variant="secondary" className="w-auto px-4 py-1.5 text-xs" onClick={() => { dispatch({ type: 'START_TASK', payload: task.id }); showToast('Task started!', 'success'); }}>Start</Button>
                  <Button variant="outline" className="w-auto px-4 py-1.5 text-xs" onClick={() => { dispatch({ type: 'COMPLETE_TASK', payload: task.id }); showToast(task.proofRequired ? 'Sent for review!' : `Completed!`, 'success'); }}>Finish</Button>
                </>
              )}
              {!isParent && task.status === 'IN_PROGRESS' && (
                <Button variant="primary" className="w-auto px-4 py-1.5 text-xs" onClick={() => { dispatch({ type: 'COMPLETE_TASK', payload: task.id }); showToast(task.proofRequired ? 'Sent for review!' : `Completed!`, 'success'); }}>Finish</Button>
              )}
              {isParent && task.status === 'NEEDS_APPROVAL' && (
                <Button variant="primary" className="w-auto px-4 py-1.5 text-xs" onClick={() => { dispatch({ type: 'APPROVE_TASK', payload: task.id }); showToast('Task approved!', 'success'); }}>Approve</Button>
              )}
              {isParent && (
                <button onClick={() => { dispatch({ type: 'DELETE_TASK', payload: task.id }); showToast('Task deleted'); }} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors ml-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </Card>
        ))}
        {displayTasks.length === 0 && (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center">
            <CheckSquare className="w-12 h-12 mb-3 opacity-20" />
            <p>No tasks found for this view.</p>
            {isParent && <Button onClick={() => setModalOpen(true)} className="mt-4 w-auto px-6" variant="secondary"><Plus className="w-4 h-4"/> Create Task</Button>}
          </div>
        )}
      </div>

      {isParent && displayTasks.length > 0 && (
        <Button className="mt-4 shrink-0" onClick={() => setModalOpen(true)}><Plus className="w-5 h-5" /> Create Task</Button>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Task Title</label>
            <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="e.g., Clean the garage" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Task Type</label>
              <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all">
                <option value="CHORE">Chore</option>
                <option value="HOMEWORK">Homework</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Points</label>
              <input type="number" value={newTask.points} onChange={e => setNewTask({...newTask, points: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Assign To</label>
            <select value={newTask.assignedToUserId} onChange={e => setNewTask({...newTask, assignedToUserId: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all">
              {state.users.filter(u => u.role !== 'PARENT').map(kid => (
                <option key={kid.id} value={kid.id}>{kid.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-all">
            <input type="checkbox" checked={newTask.proofRequired} onChange={e => setNewTask({...newTask, proofRequired: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
            <div>
              <span className="font-bold text-slate-900 block text-sm">Require Proof</span>
              <span className="text-xs text-slate-500">Kid must submit photo/note for approval</span>
            </div>
          </label>
          <Button type="submit" className="mt-6">Save Task</Button>
        </form>
      </Modal>
    </div>
  );
};

const CalendarView = () => (
  <div className="p-8 h-full flex flex-col items-center justify-center text-center text-slate-500 animate-in fade-in duration-300">
    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
      <CalendarIcon className="w-10 h-10 text-indigo-500 animate-bounce" />
    </div>
    <h2 className="text-xl font-bold mb-2 text-slate-900">Family Schedule</h2>
    <p className="max-w-xs">Calendar integration allows you to sync Google, Outlook, and Apple calendars.</p>
    <Button className="mt-6 w-auto px-6">Connect Calendar</Button>
  </div>
);

const MealsView = () => {
  const { state, dispatch, showToast, entitlements, usageCount } = useContext(AppContext);
  const [activeSubTab, setActiveSubTab] = useState('PLAN');
  const isParent = true; 
  
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewRecipe, setViewRecipe] = useState(null);
  const [planModalDate, setPlanModalDate] = useState(null);
  const [newItem, setNewItem] = useState('');

  const handleGenerateRecipe = async (e) => {
    e.preventDefault();
    if (usageCount >= entitlements.aiActionsMonthly) { showToast("AI limit reached for your plan.", "error"); return; }
    setIsGenerating(true);
    try {
      const data = await generateSmartRecipe(aiPrompt);
      const newRecipe = {
        id: Math.random().toString(), title: data.title, prepTime: data.prepTime, cookTime: data.cookTime,
        ingredients: data.ingredients, instructions: data.instructions, isAIGenerated: true
      };
      dispatch({ type: 'ADD_RECIPE', payload: newRecipe });
      dispatch({ type: 'INCREMENT_AI' });
      showToast('AI Recipe created!', 'success');
      setAiModalOpen(false);
      setAiPrompt('');
      setViewRecipe(newRecipe); 
    } catch (err) { showToast('Failed to generate recipe.', 'error'); } finally { setIsGenerating(false); }
  };

  const handleAddGroceries = (ingredients) => {
    const newItems = ingredients.map(ing => ({ id: Math.random().toString(), name: ing, isChecked: false }));
    dispatch({ type: 'ADD_MULTIPLE_SHOPPING_ITEMS', payload: newItems });
    showToast('Ingredients added to list!', 'success');
  };

  const submitShoppingItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    dispatch({ type: 'ADD_SHOPPING_ITEM', payload: newItem.trim() });
    setNewItem('');
  };

  const today = new Date();
  const weekDays = [0, 1, 2, 3].map(offset => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return { dateStr: d.toISOString().split('T')[0], display: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) };
  });

  const activeGroceries = state.shoppingList.filter(i => !i.isChecked);
  const completedGroceries = state.shoppingList.filter(i => i.isChecked);

  return (
    <div className="p-4 sm:p-6 pb-24 h-full flex flex-col relative animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Meals</h1>
      </div>
      
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 shrink-0">
        {[
          { id: 'PLAN', label: 'Plan', icon: CalendarIcon },
          { id: 'RECIPES', label: 'Recipes', icon: BookOpen },
          { id: 'LIST', label: 'List', icon: ShoppingCart }
        ].map(tab => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${
                isActive ? 'bg-white text-slate-900 shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700 hover:scale-105'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {activeSubTab === 'PLAN' && (
          <div className="space-y-4">
            {weekDays.map(day => {
              const plan = state.mealPlan.find(m => m.date === day.dateStr);
              const recipe = plan ? state.recipes.find(r => r.id === plan.recipeId) : null;
              return (
                <div key={day.dateStr}>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{day.display}</h3>
                  {recipe ? (
                    <Card className="flex justify-between items-center bg-white border-slate-200 shadow-sm">
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setViewRecipe(recipe)}>
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                          {recipe.isAIGenerated ? '✨' : '🍲'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{recipe.title}</h4>
                          <p className="text-xs text-slate-500 font-medium">Dinner • {recipe.prepTime} prep</p>
                        </div>
                      </div>
                      <button onClick={() => dispatch({ type: 'REMOVE_FROM_MEAL_PLAN', payload: plan.id })} className="p-2 text-slate-300 hover:text-rose-500 rounded-full transition-colors hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Card>
                  ) : (
                    <button onClick={() => setPlanModalDate(day.dateStr)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all hover:shadow-inner">
                      <Plus className="w-4 h-4" /> Add Dinner
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {activeSubTab === 'RECIPES' && (
          <div className="space-y-4">
            <PremiumGate feature="automations" fallback={
               <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none p-5 relative overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all" onClick={() => dispatch({ type: 'CHANGE_PLAN', payload: 'PRO' })}>
                  <Lock className="absolute right-4 top-4 w-5 h-5 text-white/20" />
                  <h3 className="font-black text-lg mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400"/> AI Kitchen</h3>
                  <p className="text-sm text-slate-300 mb-3 max-w-[85%]">Upgrade to PRO to generate recipes instantly from ingredients you already have.</p>
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Unlock Feature &rarr;</span>
               </Card>
            }>
               <Card onClick={() => setAiModalOpen(true)} className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none p-5 relative overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all active:scale-[0.98]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[4rem] opacity-20 pointer-events-none"></div>
                  <h3 className="font-black text-lg mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-300"/> AI Recipe Generator</h3>
                  <p className="text-sm text-indigo-100 font-medium max-w-[85%]">Type what's in your fridge, get a step-by-step recipe.</p>
               </Card>
            </PremiumGate>

            <div className="grid grid-cols-2 gap-3 mt-2">
              {state.recipes.map(recipe => (
                <Card key={recipe.id} onClick={() => setViewRecipe(recipe)} className="flex flex-col p-4 border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer">
                  <div className="text-2xl mb-2">{recipe.isAIGenerated ? '✨' : '🍲'}</div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">{recipe.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">{recipe.prepTime} prep</p>
                </Card>
              ))}
              {state.recipes.length === 0 && (
                 <div className="col-span-2 text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                    <ChefHat className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium text-sm mb-4">No recipes yet.</p>
                    <Button variant="secondary" className="w-auto px-6 text-xs" onClick={() => setAiModalOpen(true)}>Generate One</Button>
                 </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'LIST' && (
          <div className="space-y-6">
            <form onSubmit={submitShoppingItem} className="flex gap-2">
              <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add item..." className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 shadow-sm transition-all" />
              <button type="submit" disabled={!newItem.trim()} className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-md">
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div>
              <div className="space-y-2">
                {activeGroceries.map(item => (
                  <div key={item.id} onClick={() => dispatch({ type: 'TOGGLE_SHOPPING_ITEM', payload: item.id })} className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm cursor-pointer active:scale-[0.98] hover:border-indigo-300 transition-all">
                    <div className="w-6 h-6 rounded-md border-2 border-slate-300 flex items-center justify-center shrink-0"></div>
                    <span className="font-semibold text-slate-700 text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
              
              {completedGroceries.length > 0 && (
                <div className="mt-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-end mb-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Completed</h3>
                    <button onClick={() => dispatch({ type: 'CLEAR_COMPLETED_SHOPPING' })} className="text-xs font-bold text-rose-500 hover:opacity-80 transition-opacity">Clear All</button>
                  </div>
                  <div className="space-y-2 opacity-60">
                    {completedGroceries.map(item => (
                      <div key={item.id} onClick={() => dispatch({ type: 'TOGGLE_SHOPPING_ITEM', payload: item.id })} className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="w-6 h-6 rounded-md border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                           <Check className="w-4 h-4 animate-check-pop" strokeWidth={3} />
                        </div>
                        <span className="font-semibold text-slate-500 text-sm line-through">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {state.shoppingList.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Your list is empty.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isAiModalOpen} onClose={() => !isGenerating && setAiModalOpen(false)} title={<span className="flex items-center gap-2 text-indigo-600"><Sparkles className="w-5 h-5"/> AI Kitchen</span>} fullHeight>
        <div className="flex flex-col h-full relative">
           <div className="flex-1 overflow-y-auto pb-6">
             <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed">
               Tell me what ingredients you have, how much time you have, or what the kids are craving, and I'll create a custom recipe instantly.
             </p>
             <form onSubmit={handleGenerateRecipe} className="space-y-4">
               <textarea 
                 rows="4" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed resize-none transition-all"
                 placeholder="e.g., We have chicken breast, rice, and broccoli. I need a 30-minute dinner that isn't spicy."
               />
               <Button type="submit" disabled={!aiPrompt.trim() || isGenerating} className="py-3.5 shadow-md">
                 {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin"/> Cooking up ideas...</> : 'Generate Recipe'}
               </Button>
             </form>
           </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewRecipe} onClose={() => setViewRecipe(null)} title={viewRecipe?.title} fullHeight>
        {viewRecipe && (
          <div className="flex flex-col h-full relative space-y-6 pb-12">
             <div className="flex gap-4">
               <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-center flex-1 shadow-sm">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prep</p>
                 <p className="font-black text-slate-800">{viewRecipe.prepTime}</p>
               </div>
               <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-center flex-1 shadow-sm">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cook</p>
                 <p className="font-black text-slate-800">{viewRecipe.cookTime}</p>
               </div>
             </div>
             <div>
               <h3 className="font-bold text-slate-900 mb-3 flex items-center justify-between">
                 Ingredients
                 <button onClick={() => { handleAddGroceries(viewRecipe.ingredients); setViewRecipe(null); setActiveSubTab('LIST'); }} className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 hover:bg-indigo-100 transition-colors">
                   <Plus className="w-3 h-3"/> Add to List
                 </button>
               </h3>
               <ul className="space-y-2">
                 {viewRecipe.ingredients.map((ing, i) => (
                   <li key={i} className="flex items-center gap-2 text-sm text-slate-600 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div> {ing}</li>
                 ))}
               </ul>
             </div>
             <div>
               <h3 className="font-bold text-slate-900 mb-3">Instructions</h3>
               <div className="space-y-3">
                 {viewRecipe.instructions.map((step, i) => (
                   <div key={i} className="flex gap-3">
                     <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
                     <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                   </div>
                 ))}
               </div>
             </div>
             <Button variant="outline" className="w-full mt-6 text-rose-500 border-rose-100 hover:bg-rose-50 hover:border-rose-200" onClick={() => { dispatch({ type: 'DELETE_RECIPE', payload: viewRecipe.id }); setViewRecipe(null); showToast('Recipe deleted'); }}>
               Delete Recipe
             </Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!planModalDate} onClose={() => setPlanModalDate(null)} title="Select a Recipe">
        <div className="space-y-3 pb-6">
          {state.recipes.length === 0 && (
             <p className="text-center text-sm text-slate-500 py-8">No recipes saved. Generate one first!</p>
          )}
          {state.recipes.map(recipe => (
            <div 
              key={recipe.id}
              onClick={() => { dispatch({ type: 'ADD_TO_MEAL_PLAN', payload: { id: Math.random().toString(), date: planModalDate, type: 'Dinner', recipeId: recipe.id } }); setPlanModalDate(null); showToast('Meal added to plan!'); }}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.98] hover:-translate-y-0.5"
            >
              <div className="text-2xl w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">{recipe.isAIGenerated ? '✨' : '🍲'}</div>
              <div>
                <h4 className="font-bold text-slate-900 text-[15px]">{recipe.title}</h4>
                <p className="text-xs font-semibold text-slate-500">{recipe.prepTime} prep • {recipe.cookTime} cook</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

const MessagesView = () => {
  const { state, currentUser, dispatch } = useContext(AppContext);
  const [msgText, setMsgText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [state.messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { id: Math.random().toString(), familyId: state.family.id, senderId: currentUser.id, channelId: 'FAMILY', text: msgText, isTask: false, isEvent: false, createdAt: new Date().toISOString() }
    });
    setMsgText('');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 animate-in fade-in duration-300">
      <div className="bg-white p-4 border-b border-slate-100 shadow-sm z-10">
        <h1 className="text-xl font-bold text-slate-900">Family Chat</h1>
        <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1 mt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse"></span> {state.users.length} Online
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {state.messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser?.id;
          const sender = state.users.find(u => u.id === msg.senderId);
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in duration-200`}>
              {!isMe && <span className="text-xs text-slate-500 mb-1 ml-1">{sender?.name.split(' ')[0]}</span>}
              <div className={`px-4 py-3 rounded-2xl max-w-[80%] shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="absolute bottom-16 sm:bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSend} className="flex gap-2">
          <button type="button" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
            <Plus className="w-6 h-6" />
          </button>
          <input 
            type="text" value={msgText} onChange={e => setMsgText(e.target.value)}
            placeholder="Message family..." 
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
          <button type="submit" disabled={!msgText.trim()} className="p-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50 transition-all active:scale-95 hover:shadow-md hover:bg-indigo-700">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

const RewardsView = () => {
  const { state, currentUser, userPoints, dispatch, showToast } = useContext(AppContext);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newReward, setNewReward] = useState({ title: '', costPoints: 100 });
  const isParent = currentUser?.role === 'PARENT';

  const handleRedeem = (reward) => {
    if (userPoints >= reward.costPoints) {
      dispatch({ type: 'REDEEM_REWARD', payload: { userId: currentUser.id, cost: reward.costPoints, title: reward.title } });
      showToast(`Redeemed: ${reward.title}!`, 'success', 'Reward Redeemed');
    } else {
      showToast("Not enough points to redeem!", 'error');
    }
  };

  const handleAddReward = (e) => {
    e.preventDefault();
    dispatch({ type: 'CREATE_REWARD', payload: newReward });
    setModalOpen(false);
    setNewReward({ title: '', costPoints: 100 });
    showToast('Reward added to the catalog!');
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col animate-in fade-in duration-300">
      <div className="bg-indigo-600 rounded-3xl p-6 text-white mb-8 shadow-lg relative overflow-hidden group">
        <div className="absolute -inset-4 bg-white/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
        <h2 className="text-indigo-200 font-medium mb-1 relative z-10">{isParent ? 'Family Points System' : 'My Balance'}</h2>
        <div className="text-4xl font-extrabold flex items-center gap-3 mb-4 relative z-10">
          <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
          {isParent ? 'Manage Store' : `${userPoints} pts`}
        </div>
        {!isParent && <p className="text-indigo-100 text-sm relative z-10">Keep completing tasks to earn more!</p>}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-900">Reward Catalog</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {state.rewards.map(reward => (
          <Card key={reward.id} className="flex flex-col items-center text-center p-6 border-slate-200">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
              <Gift className="w-8 h-8 text-indigo-500" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-1 leading-tight">{reward.title}</h4>
            <span className="text-indigo-600 font-bold mb-4">{reward.costPoints} pts</span>
            
            {!isParent && (
              <Button 
                variant={userPoints >= reward.costPoints ? 'primary' : 'secondary'} 
                className="py-2 text-sm mt-auto"
                disabled={userPoints < reward.costPoints}
                onClick={() => handleRedeem(reward)}
              >
                {userPoints >= reward.costPoints ? 'Redeem' : 'Need more'}
              </Button>
            )}
            {isParent && (
               <div className="flex gap-2 w-full mt-auto">
                 <button onClick={() => { dispatch({ type: 'DELETE_REWARD', payload: reward.id }); showToast('Reward deleted'); }} className="p-2 w-full flex items-center justify-center text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-xl transition-colors active:scale-95">
                   <Trash2 className="w-5 h-5" />
                 </button>
               </div>
            )}
          </Card>
        ))}
        {isParent && (
          <Card className="flex flex-col items-center justify-center text-center p-6 border-slate-200 border-dashed hover:bg-slate-50 transition-colors" onClick={() => setModalOpen(true)}>
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400"><Plus className="w-6 h-6"/></div>
             <span className="font-bold text-slate-600">Add Reward</span>
          </Card>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Create New Reward">
        <form onSubmit={handleAddReward} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Reward Title</label>
            <input required type="text" value={newReward.title} onChange={e => setNewReward({...newReward, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="e.g., Ice Cream Trip" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Cost (Points)</label>
            <input required type="number" value={newReward.costPoints} onChange={e => setNewReward({...newReward, costPoints: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
          </div>
          <Button type="submit" className="mt-6">Save Reward</Button>
        </form>
      </Modal>
    </div>
  );
};

const SettingsView = () => {
  const { state, dispatch, entitlements, usageCount, showToast } = useContext(AppContext);
  const plan = state.family.plan;
  const pushEnabled = state.family.pushEnabled;
  const [isMembersModalOpen, setMembersModalOpen] = useState(false);
  const [isStripeModalOpen, setStripeModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: 'CHILD' });

  const handleAddMember = (e) => {
    e.preventDefault();
    const avatars = ['👨', '👩', '👦', '👧', '👶', '👴', '👵'];
    const member = {
      id: 'u' + Math.random().toString(36).substr(2, 9), familyId: state.family.id, name: newMember.name, role: newMember.role,
      level: newMember.role !== 'PARENT' ? 1 : null, streak: newMember.role !== 'PARENT' ? 0 : null, avatar: avatars[state.users.length % avatars.length]
    };
    dispatch({ type: 'ADD_MEMBER', payload: member });
    setNewMember({ name: '', role: 'CHILD' });
    setMembersModalOpen(false);
    showToast(`${member.name} added to the family!`);
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) { showToast("Browser does not support notifications", "error"); return; }
    if (pushEnabled) { dispatch({ type: 'TOGGLE_PUSH_NOTIFICATIONS', payload: false }); showToast("Push notifications disabled"); return; }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        dispatch({ type: 'TOGGLE_PUSH_NOTIFICATIONS', payload: true });
        new Notification("FamilyOS", { body: "Push notifications enabled!", icon: "✨" });
        showToast("Push notifications enabled!");
      } else { showToast("Permission denied by browser", "error"); }
    } catch (e) { showToast("Error requesting permissions", "error"); }
  };

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Subscription</h2>
        <Card className="border-indigo-100 overflow-hidden p-0 relative hover:-translate-y-0 hover:shadow-sm cursor-default">
          {plan === 'PRO' && <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400 rounded-full blur-[3rem] opacity-20 pointer-events-none"></div>}
          <div className="p-5 flex justify-between items-center border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Plan</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-slate-900">FamilyOS {plan}</span>
                {plan === 'PRO' && <Zap className="w-5 h-5 text-violet-500 fill-violet-500"/>}
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900">{plan === 'FREE' ? '$0' : plan === 'PLUS' ? '$4.99' : '$9.99'}</span>
              <span className="text-xs text-slate-500">/mo</span>
            </div>
          </div>
          <div className="p-4 bg-slate-50">
            {plan !== 'PRO' ? (
              <Button onClick={() => setStripeModalOpen(true)} variant="premium" className="py-3 shadow-md shadow-violet-500/20 active:scale-95">Upgrade to PRO</Button>
            ) : (
              <Button variant="outline" className="py-3 bg-white text-slate-700 active:scale-95">Manage Subscription</Button>
            )}
          </div>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">AI Usage</h2>
        <Card className="hover:-translate-y-0 hover:shadow-sm cursor-default">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-slate-700">Monthly Actions</span>
            <span className="text-slate-500">{usageCount} / {entitlements.aiActionsMonthly === Infinity ? 'Unlimited' : entitlements.aiActionsMonthly}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (usageCount / (entitlements.aiActionsMonthly === Infinity ? usageCount+1 : entitlements.aiActionsMonthly)) * 100)}%` }} />
          </div>
        </Card>
      </section>
      
      <section className="space-y-3 text-slate-600">
         <Card onClick={requestNotificationPermission} className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 active:scale-[0.98]">
           <div className="flex items-center gap-3"><Smartphone className="w-5 h-5"/> Push Notifications</div>
           <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${pushEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
             <div className={`w-4 h-4 bg-white rounded-full transition-transform ${pushEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
           </div>
         </Card>
         <Card onClick={() => setMembersModalOpen(true)} className="flex items-center gap-3 py-3 cursor-pointer hover:bg-slate-50 active:scale-[0.98]"><Users className="w-5 h-5"/> Manage Members</Card>
         <Card className="flex items-center gap-3 py-3 cursor-pointer hover:bg-slate-50 active:scale-[0.98]"><ShieldCheck className="w-5 h-5"/> Parental Controls</Card>
      </section>

      <StripeCheckoutModal isOpen={isStripeModalOpen} onClose={() => setStripeModalOpen(false)} />

      <Modal isOpen={isMembersModalOpen} onClose={() => setMembersModalOpen(false)} title="Manage Members" fullHeight>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Current Members</h3>
            <div className="space-y-3">
              {state.users.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">{u.avatar}</div>
                    <div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</p>
                    </div>
                  </div>
                  {u.role !== 'PARENT' && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Lvl {u.level}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Add New Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                <input required type="text" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="e.g., Alex" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                <select value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all">
                  <option value="CHILD">Child</option>
                  <option value="TEEN">Teen</option>
                  <option value="PARENT">Parent</option>
                </select>
              </div>
              <Button type="submit" variant="primary" className="w-full"><UserPlus className="w-4 h-4"/> Add Member</Button>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [state, dispatch] = useReducer(appReducer, seedData);
  const [currentUserId, setCurrentUserId] = useState('u1');
  const [activeTab, setActiveTab] = useState('home');
  const [showSplash, setShowSplash] = useState(true);
  const [splashState, setSplashState] = useState('loading'); 
  const [splashProgress, setSplashProgress] = useState(0);
  
  const [setupStep, setSetupStep] = useState('ROLE'); 
  const [setupRole, setSetupRole] = useState('PARENT');

  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const firestoreDispatch = (action) => {
    if (action.type === 'CHANGE_TAB') { setActiveTab(action.payload); return; }
    const nextState = appReducer(state, action);
    dispatch(action); 
    if (user && action.type !== 'LOAD_STATE') {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'familyState', 'main');
      setDoc(docRef, nextState).catch(console.error);
    }
  };

  const showToast = (message, type = 'success', nativeTitle = null) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (error) { console.error("Auth error:", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'familyState', 'main');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) { dispatch({ type: 'LOAD_STATE', payload: docSnap.data() }); setIsLoaded(true); } 
      else { setDoc(docRef, seedData).then(() => setIsLoaded(true)).catch(console.error); }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (isLoaded && splashState === 'loading') {
      const interval = setInterval(() => {
        setSplashProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setSplashState('ready');
            return 100;
          }
          return p + Math.floor(Math.random() * 20) + 10;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isLoaded, splashState]);

  const handleEnterApp = () => {
    setSplashState('exiting');
    setTimeout(() => setShowSplash(false), 600); 
  };

  const currentUser = state.users.find(u => u.id === currentUserId);
  const entitlements = getEntitlements(state.family.plan);
  const usageCount = state.usageCounters[0].aiActionsUsed;
  const userPoints = state.pointsLedger.filter(l => l.userId === currentUser?.id).reduce((sum, l) => sum + l.amount, 0);

  const contextValue = { state, dispatch: firestoreDispatch, currentUser, setCurrentUserId, entitlements, usageCount, userPoints, showToast };

  if (showSplash) {
    return (
      <div className="w-full h-screen bg-slate-950 flex items-center justify-center font-sans text-slate-900 selection:bg-indigo-100">
        <CustomStyles />
        <div className={`w-full max-w-md h-full sm:h-[850px] sm:rounded-[3rem] bg-slate-950 overflow-hidden relative flex flex-col items-center justify-center sm:border-[12px] border-slate-900 shadow-[0_0_100px_rgba(79,70,229,0.15)] transition-all duration-700 ${splashState === 'exiting' ? 'scale-110 opacity-0 blur-md' : 'scale-100 opacity-100'}`}>
           <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40 mix-blend-screen">
             <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
             <div className="absolute top-[20%] right-[-10%] w-[70%] h-[70%] bg-violet-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000"></div>
             <div className="absolute bottom-[-20%] left-[10%] w-[70%] h-[70%] bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-4000"></div>
           </div>

           <div className="flex flex-col items-center z-10 w-full px-12">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)] border border-white/20 relative overflow-hidden animate-float">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-md mb-2">FamilyOS</h1>
              <p className="text-indigo-200/80 font-semibold text-sm tracking-[0.3em] uppercase mb-16">System Booting</p>

              <div className="w-full h-16 flex items-center justify-center">
                {splashState === 'loading' ? (
                  <div className="w-full animate-in fade-in duration-300">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2 shadow-inner">
                       <div className="h-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 rounded-full transition-all duration-200 ease-out" style={{ width: `${splashProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-center font-bold text-white/50 tracking-widest uppercase">Syncing Data {splashProgress}%</p>
                  </div>
                ) : (
                  <button 
                    onClick={handleEnterApp}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 animate-in zoom-in-90 fade-in flex items-center justify-center gap-2 group"
                  >
                    Tap to Enter <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (!state.family.onboarded) {
    return (
      <AppContext.Provider value={contextValue}>
        <div className="w-full h-screen bg-[#f8fafc] sm:bg-slate-100 flex items-center justify-center font-sans text-slate-900">
          <div className="w-full max-w-md h-full sm:h-[850px] sm:rounded-[3rem] bg-white shadow-2xl overflow-hidden relative sm:border-[12px] border-slate-900">
            {setupStep === 'ROLE' && <RoleSelectionScreen onNext={(role) => { setSetupRole(role); setSetupStep('FAMILY'); }} />}
            {setupStep === 'FAMILY' && <FamilySetupScreen initialRole={setupRole} onBack={() => setSetupStep('ROLE')} onNext={(payload) => { firestoreDispatch({ type: 'SETUP_FAMILY', payload }); const me = payload.members.find(m => m.isMe); if (me) setCurrentUserId(me.id); setSetupStep('WEEK_STYLE'); }} />}
            {setupStep === 'WEEK_STYLE' && <WeekStyleScreen onBack={() => setSetupStep('FAMILY')} onNext={(weekStyle) => { firestoreDispatch({ type: 'UPDATE_WEEK_STYLE', payload: weekStyle }); setSetupStep('CALENDAR_SYNC'); }} />}
            {setupStep === 'CALENDAR_SYNC' && <CalendarSyncScreen onBack={() => setSetupStep('WEEK_STYLE')} onNext={() => setSetupStep('TASK_TEMPLATES')} />}
            {setupStep === 'TASK_TEMPLATES' && <TaskTemplatesScreen onBack={() => setSetupStep('CALENDAR_SYNC')} onNext={(selectedTasks) => { if (selectedTasks.length > 0) firestoreDispatch({ type: 'ADD_TEMPLATE_TASKS', payload: selectedTasks }); setSetupStep('REWARD_TEMPLATES'); }} />}
            {setupStep === 'REWARD_TEMPLATES' && <RewardTemplatesScreen onBack={() => setSetupStep('TASK_TEMPLATES')} onNext={(selectedRewards) => { if (selectedRewards.length > 0) firestoreDispatch({ type: 'ADD_TEMPLATE_REWARDS', payload: selectedRewards }); setSetupStep('NOTIFICATION_PREFS'); }} />}
            {setupStep === 'NOTIFICATION_PREFS' && <NotificationPrefsScreen onBack={() => setSetupStep('REWARD_TEMPLATES')} onNext={(prefs) => { firestoreDispatch({ type: 'UPDATE_NOTIFICATION_PREFS', payload: prefs }); setSetupStep('ALL_SET'); }} />}
            {setupStep === 'ALL_SET' && <AllSetScreen onBack={() => setSetupStep('NOTIFICATION_PREFS')} onFinish={() => firestoreDispatch({ type: 'COMPLETE_ONBOARDING' })} />}
          </div>
        </div>
      </AppContext.Provider>
    );
  }

  const renderScreen = () => {
    switch(activeTab) {
      case 'home': return <Dashboard />;
      case 'tasks': return <TasksView />;
      case 'calendar': return <CalendarView />;
      case 'meals': return <MealsView />;
      case 'rewards': return <RewardsView />;
      case 'settings': return <SettingsView />;
      default: return <div className="p-8 text-center text-slate-500">Coming soon</div>;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="w-full h-screen bg-slate-100 flex items-center justify-center font-sans text-slate-900 selection:bg-indigo-100">
        
        <div className="w-full max-w-md h-full sm:h-[850px] sm:rounded-[3rem] bg-slate-50 shadow-2xl overflow-hidden relative flex flex-col sm:border-[12px] border-slate-900 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="bg-slate-900 text-white p-3 flex justify-between items-center text-xs z-50 shrink-0">
            <span className="font-bold tracking-widest text-slate-400">FamilyOS DEV</span>
            <select 
              className="bg-slate-800 text-white border border-slate-700 hover:border-slate-500 outline-none rounded p-1.5 cursor-pointer transition-colors"
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
            >
              {state.users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>

          <main className="flex-1 overflow-y-auto relative no-scrollbar bg-slate-50/50">
             {renderScreen()}
          </main>

          <div className="absolute bottom-24 right-4 z-50">
            <button 
              onClick={() => setIsCopilotOpen(true)}
              className="group w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 relative"
            >
              <div className="absolute -inset-2 bg-indigo-500 rounded-full blur-md opacity-20 group-hover:opacity-40 animate-pulse transition-opacity"></div>
              <Sparkles className="w-6 h-6 text-white relative z-10" />
            </button>
          </div>

          <div className="absolute top-16 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
            {toasts.map(t => (
              <div key={t.id} className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold animate-in slide-in-from-top-4 fade-in duration-300 backdrop-blur-md border ${t.type === 'error' ? 'bg-slate-900/90 text-white border-slate-800' : 'bg-emerald-500/90 text-white border-emerald-400'}`}>
                {t.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                {t.message}
              </div>
            ))}
          </div>

          <CopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />

          <div className="px-4 pb-4 pt-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent shrink-0 z-40 relative pointer-events-none">
            <nav className="bg-white/90 backdrop-blur-2xl px-2 py-2 flex justify-between items-center shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[2rem] ring-1 ring-slate-900/5 overflow-x-auto no-scrollbar mx-auto w-full max-w-sm pointer-events-auto">
              {[
                { id: 'home', icon: Home, label: 'Today' },
                { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
                { id: 'calendar', icon: CalendarIcon, label: 'Plan' },
                { id: 'meals', icon: ChefHat, label: 'Meals' },
                { id: 'rewards', icon: Gift, label: 'Rewards' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 min-w-[50px] py-2 ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95'}`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-indigo-50/80 rounded-[1.5rem] -z-10 animate-in zoom-in-90 duration-200"></div>
                    )}
                    <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'fill-indigo-100/50' : ''}`} />
                    <span className={`text-[9px] tracking-wide transition-all mt-0.5 ${isActive ? 'font-extrabold' : 'font-semibold'}`}>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}
