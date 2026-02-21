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
  RefreshCw, Smartphone, CreditCard, ShoppingCart
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
  const apiKey = ""; // Populated automatically by the environment
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

// --- MOCK DATABASE (Simulating Prisma Schema & Seed) ---
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
        id: m.id,
        familyId: state.family.id,
        role: m.role,
        name: m.name || (m.role === 'PARENT' ? 'Parent' : 'Kid'),
        level: m.role !== 'PARENT' ? 1 : null,
        streak: m.role !== 'PARENT' ? 0 : null
      }));

      // Give kids starting points
      const newPoints = newUsers.filter(u => u.role !== 'PARENT').map(u => ({
        id: Math.random().toString(),
        userId: u.id,
        amount: 100,
        reason: 'Welcome Bonus',
        createdAt: new Date().toISOString()
      }));

      // Give kids a default task
      const welcomeTasks = newUsers.filter(u => u.role !== 'PARENT').map(u => ({
         id: Math.random().toString(), familyId: state.family.id, assignedToUserId: u.id,
         title: 'Explore FamilyOS', type: 'GENERAL', status: 'TODO', points: 50, proofRequired: false,
         dueAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date().toISOString()
      }));

      return {
        ...state,
        family: { ...state.family, name: familyName || 'My Family' },
        users: newUsers,
        pointsLedger: newPoints,
        tasks: welcomeTasks,
        events: [],
        messages: [{ id: 'm1', familyId: state.family.id, senderId: newUsers[0].id, channelId: 'FAMILY', text: `Welcome to the ${familyName || 'Family'} FamilyOS!`, isTask: false, isEvent: false, createdAt: new Date().toISOString() }]
      };
    }
    case 'UPDATE_WEEK_STYLE':
      return {
        ...state,
        family: { ...state.family, weekStyle: action.payload }
      };
    case 'ADD_TEMPLATE_TASKS': {
      const assignee = state.users.find(u => u.role !== 'PARENT') || state.users[0];
      const newTasks = action.payload.map(t => ({
        id: Math.random().toString(),
        familyId: state.family.id,
        assignedToUserId: assignee.id,
        title: t.title,
        type: t.type,
        status: 'TODO',
        points: t.points,
        proofRequired: t.type === 'CHORE',
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString()
      }));
      return { ...state, tasks: [...state.tasks, ...newTasks] };
    }
    case 'ADD_TEMPLATE_REWARDS': {
      const newRewards = action.payload.map(r => ({
        id: Math.random().toString(),
        familyId: state.family.id,
        title: r.title,
        costPoints: r.points,
        active: true
      }));
      return { ...state, rewards: newRewards };
    }
    case 'UPDATE_NOTIFICATION_PREFS':
      return {
        ...state,
        family: { ...state.family, notificationPrefs: action.payload }
      };
    case 'TOGGLE_PUSH_NOTIFICATIONS':
      return {
        ...state,
        family: { ...state.family, pushEnabled: action.payload }
      };
    case 'SYNC_EXTERNAL_CALENDAR': {
      const newEvents = action.payload.map(e => ({
        ...e,
        id: Math.random().toString(),
        familyId: state.family.id,
        status: 'ACTIVE'
      }));
      return {
        ...state,
        family: { ...state.family, calendarSynced: true },
        events: [...state.events, ...newEvents]
      };
    }
    case 'CHANGE_PLAN':
      return { ...state, family: { ...state.family, plan: action.payload } };
    case 'START_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload ? { ...t, status: 'IN_PROGRESS' } : t)
      };
    case 'COMPLETE_TASK': {
      const task = state.tasks.find(t => t.id === action.payload);
      const newStatus = task.proofRequired ? 'NEEDS_APPROVAL' : 'DONE';
      let newState = {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload ? { ...t, status: newStatus } : t)
      };
      if (!task.proofRequired) {
        newState.pointsLedger = [...newState.pointsLedger, {
          id: Math.random().toString(), userId: task.assignedToUserId, amount: task.points, reason: `Completed: ${task.title}`, createdAt: new Date().toISOString()
        }];
      }
      return newState;
    }
    case 'APPROVE_TASK': {
      const task = state.tasks.find(t => t.id === action.payload);
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload ? { ...t, status: 'DONE' } : t),
        pointsLedger: [...state.pointsLedger, {
          id: Math.random().toString(), userId: task.assignedToUserId, amount: task.points, reason: `Approved: ${task.title}`, createdAt: new Date().toISOString()
        }]
      };
    }
    case 'REDEEM_REWARD':
      return {
        ...state,
        pointsLedger: [...state.pointsLedger, {
          id: Math.random().toString(), userId: action.payload.userId, amount: -action.payload.cost, reason: `Redeemed: ${action.payload.title}`, createdAt: new Date().toISOString()
        }]
      };
    case 'INCREMENT_AI':
      return {
        ...state,
        usageCounters: state.usageCounters.map(c => 
          c.familyId === state.family.id ? { ...c, aiActionsUsed: c.aiActionsUsed + 1 } : c
        )
      };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'APPROVE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload ? { ...e, status: 'ACTIVE' } : e)
      };
    case 'CREATE_TASK':
      return {
        ...state,
        tasks: [...state.tasks, { ...action.payload, id: Math.random().toString(), status: 'TODO', createdAt: new Date().toISOString() }]
      };
    case 'CREATE_REWARD':
      return {
        ...state,
        rewards: [...state.rewards, { ...action.payload, id: Math.random().toString(), familyId: state.family.id, active: true }]
      };
    case 'CREATE_EVENT':
      return {
        ...state,
        events: [...state.events, { ...action.payload, id: Math.random().toString(), status: 'ACTIVE' }]
      };
    case 'GENERATE_AI_PLAN':
      return {
        ...state,
        tasks: [...state.tasks, ...action.payload],
        usageCounters: state.usageCounters.map(c => 
          c.familyId === state.family.id ? { ...c, aiActionsUsed: c.aiActionsUsed + 1 } : c
        )
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.payload) };
    case 'DELETE_REWARD':
      return { ...state, rewards: state.rewards.filter(r => r.id !== action.payload) };
    case 'ADD_MEMBER': {
      const newMember = action.payload;
      const newPoints = newMember.role !== 'PARENT' ? [{
        id: Math.random().toString(), userId: newMember.id, amount: 100, reason: 'Welcome Bonus', createdAt: new Date().toISOString()
      }] : [];
      return { 
        ...state, 
        users: [...state.users, newMember],
        pointsLedger: [...state.pointsLedger, ...newPoints]
      };
    }
    case 'AWARD_POINTS':
      return {
        ...state,
        pointsLedger: [...state.pointsLedger, {
          id: Math.random().toString(), userId: action.payload.userId, amount: action.payload.amount, reason: action.payload.reason, createdAt: new Date().toISOString()
        }]
      };
    case 'COMPLETE_ALL_TASKS': {
      const updatedTasks = state.tasks.map(t => ({ ...t, status: 'DONE' }));
      return { ...state, tasks: updatedTasks };
    }
    case 'ADD_RECIPE':
      return { ...state, recipes: [...state.recipes, action.payload] };
    case 'DELETE_RECIPE':
      return { ...state, recipes: state.recipes.filter(r => r.id !== action.payload), mealPlan: state.mealPlan.filter(m => m.recipeId !== action.payload) };
    case 'ADD_TO_MEAL_PLAN':
      return { ...state, mealPlan: [...state.mealPlan.filter(m => m.date !== action.payload.date), action.payload] };
    case 'REMOVE_FROM_MEAL_PLAN':
      return { ...state, mealPlan: state.mealPlan.filter(m => m.id !== action.payload) };
    case 'ADD_SHOPPING_ITEM':
      return { ...state, shoppingList: [{ id: Math.random().toString(), name: action.payload, isChecked: false }, ...state.shoppingList] };
    case 'TOGGLE_SHOPPING_ITEM':
      return {
        ...state,
        shoppingList: state.shoppingList.map(item =>
          item.id === action.payload ? { ...item, isChecked: !item.isChecked } : item
        )
      };
    case 'CLEAR_COMPLETED_SHOPPING':
      return { ...state, shoppingList: state.shoppingList.filter(item => !item.isChecked) };
    case 'ADD_MULTIPLE_SHOPPING_ITEMS':
      return { ...state, shoppingList: [...action.payload, ...state.shoppingList] };
    default:
      return state;
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
  const isAllowed = typeof entitlements[feature] === 'number' 
    ? true 
    : !!entitlements[feature]; 

  if (!isAllowed && fallback) return fallback;
  if (!isAllowed) return null;
  return children;
};

const Card = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''} ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "w-full font-semibold rounded-xl py-3 px-4 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    premium: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-md",
    outline: "border-2 border-slate-200 text-slate-700 hover:border-slate-300"
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    premium: "bg-violet-100 text-violet-700",
    fire: "bg-orange-100 text-orange-600 border border-orange-200"
  };
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
};

// --- MODAL COMPONENT ---
const Modal = ({ isOpen, onClose, title, children, fullHeight = false }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white w-full ${fullHeight ? 'h-[95%]' : 'h-[85%]'} sm:h-auto sm:max-h-[85%] rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-300 relative`}>
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
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
    // Simulate network delay for payment processing
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
            <input required type="email" defaultValue="parent@family.com" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 shadow-sm" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Card Information</label>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
              className="w-full bg-[#0a2540] hover:bg-[#0f355c] text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg"
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
    { role: 'ai', text: "Hi! I'm your FamilyOS Copilot. I can manage schedules, suggest meals, or even update the database for you. Try asking me to 'Complete all tasks' or 'Give Daisy 50 points'!" }
  ]);
  const [input, setInput] = useState('');
  
  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    
    // Simulate AI thinking and Intent Parsing
    setTimeout(() => {
      if (!entitlements.copilot) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          isUpsell: true,
          text: "Executing commands is a feature of FamilyOS PRO! Upgrade to unlock the full conversational AI to auto-schedule your family's life, balance chore loads fairly, and update the database." 
        }]);
      } else {
        const lowerInput = userMessage.toLowerCase();
        let handled = false;

        // Intent 1: Complete Tasks
        if (lowerInput.includes('complete') || lowerInput.includes('finish') || lowerInput.includes('clear')) {
          dispatch({ type: 'COMPLETE_ALL_TASKS' });
          showToast('Database updated: All tasks completed!', 'success', 'Copilot Action');
          setMessages(prev => [...prev, { role: 'ai', text: "Done! I've accessed the database and marked all pending tasks as complete." }]);
          handled = true;
        } 
        // Intent 2: Award Points
        else if (lowerInput.includes('give') || lowerInput.includes('point') || lowerInput.includes('award')) {
          const kids = state.users.filter(u => u.role !== 'PARENT');
          if (kids.length > 0) {
            const targetKid = kids[0]; // Naive parsing: just picks the first kid for demo
            dispatch({ type: 'AWARD_POINTS', payload: { userId: targetKid.id, amount: 50, reason: 'Copilot Bonus' } });
            showToast(`Deposited 50 pts to ${targetKid.name}`, 'success', 'Copilot Action');
            setMessages(prev => [...prev, { role: 'ai', text: `I've successfully deposited 50 bonus points directly into ${targetKid.name}'s ledger!` }]);
            handled = true;
          }
        }

        // Fallback for general chat
        if (!handled) {
          setMessages(prev => [...prev, { role: 'ai', text: "I can certainly analyze that for you! (For this demo, try asking me to 'complete all tasks' or 'give points' to see my live database capabilities!)" }]);
        }
      }
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<span className="flex items-center gap-2 text-violet-700"><Sparkles className="w-5 h-5"/> Family Copilot</span>} fullHeight>
      <div className="flex flex-col h-full relative">
        <div className="flex-1 overflow-y-auto space-y-4 pb-20">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : msg.isUpsell 
                    ? 'bg-gradient-to-r from-violet-100 to-indigo-100 border border-violet-200 text-violet-900 rounded-bl-none shadow-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
              }`}>
                {msg.text}
                {msg.isUpsell && (
                  <Button variant="premium" className="mt-4 py-2 text-xs" onClick={() => dispatch({ type: 'CHANGE_PLAN', payload: 'PRO' })}>
                    Unlock PRO Copilot <Zap className="w-4 h-4"/>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="absolute bottom-0 left-0 right-0 bg-white pt-2 border-t border-slate-100 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me to schedule a dinner..." 
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button type="submit" disabled={!input.trim()} className="p-3 bg-violet-600 text-white rounded-xl disabled:opacity-50 transition-opacity">
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
      <div className="w-16 h-16 bg-[#7c3aed] rounded-[1.5rem] flex items-center justify-center text-white mb-6 shadow-md shadow-violet-200">
        <Users className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Welcome to FamilyOS</h1>
      <p className="text-slate-500 text-sm px-8 mb-8 font-medium">Less nagging, more clarity. Let's set up your family command center.</p>

      <p className="font-bold text-[#334155] mb-4">I am a...</p>

      <div className="flex flex-col gap-3 w-full px-6 max-w-sm">
        {roles.map(r => {
          const isSelected = selectedRole === r.id;
          const Icon = r.icon;
          return (
            <div 
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'border-[#7c3aed] bg-[#7c3aed]/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${isSelected ? 'bg-[#7c3aed] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-[#0f172a] text-lg leading-tight mb-0.5">{r.title}</h3>
                <p className="text-[13px] text-slate-500">{r.desc}</p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 bg-[#7c3aed] rounded-full flex items-center justify-center text-white animate-in zoom-in duration-200 shadow-sm">
                   <Check className="w-4 h-4" strokeWidth={3} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 w-full p-6 flex justify-end">
        <button 
          className="bg-[#7c3aed] text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-violet-600/20 active:scale-95 transition-all" 
          onClick={() => onNext(selectedRole)}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// 2. Family Setup Builder Screen
const FamilySetupScreen = ({ initialRole, onBack, onNext }) => {
  const [familyName, setFamilyName] = useState('');
  const [members, setMembers] = useState([
    { id: 'u1', name: '', role: initialRole, isMe: true, avatar: initialRole === 'PARENT' ? '👱‍♂️' : '👦' }
  ]);

  const addMember = () => {
    const avatars = ['👨', '👩', '👦', '👧', '👶', '👴', '👵'];
    setMembers([...members, { 
       id: 'u' + Math.random().toString(36).substr(2, 9), 
       name: '', 
       role: 'CHILD', 
       isMe: false, 
       avatar: avatars[members.length % avatars.length] 
    }]);
  };

  const updateMember = (id, field, val) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const isValid = familyName.trim() !== '' && members.every(m => m.name.trim() !== '');

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        <h1 className="text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Create Your Family</h1>
        <p className="text-slate-500 text-sm mb-8 font-medium">Add your family members. Kids don't need email addresses.</p>

        <div className="mb-6">
          <label className="block text-sm font-bold text-[#334155] mb-2">Family Name</label>
          <input 
            type="text" 
            value={familyName}
            onChange={e => setFamilyName(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] shadow-sm transition-all" 
            placeholder="The Smiths" 
          />
        </div>

        <div className="mb-2">
          <label className="block text-sm font-bold text-[#334155] mb-2">Family Members</label>
          <div className="space-y-4">
            {members.map((member, idx) => (
              <div key={member.id} className="relative bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
                {member.isMe && (
                  <div className="absolute -top-3 -right-2 bg-[#9333ea] text-white text-[10px] font-extrabold px-3 py-1 rounded-full border-2 border-white z-10 tracking-wider shadow-sm">
                    YOU
                  </div>
                )}
                <div className="flex items-center gap-4">
                   <div className="text-4xl bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100">
                     {member.avatar}
                   </div>
                   <div className="flex-1 space-y-3">
                      <input 
                        type="text" 
                        value={member.name}
                        onChange={e => updateMember(member.id, 'name', e.target.value)}
                        placeholder={member.isMe ? "Your name" : "Member name"}
                        className="w-full bg-transparent border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#7c3aed]" 
                      />
                      <div className="flex gap-2">
                         {['PARENT', 'TEEN', 'CHILD'].map(r => (
                            <button 
                              key={r}
                              onClick={() => updateMember(member.id, 'role', r)}
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${member.role === r ? 'bg-[#a855f7] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                              {r.charAt(0) + r.slice(1).toLowerCase()}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button onClick={addMember} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors py-2">
          <Plus className="w-4 h-4" /> Add Family Member
        </button>
      </div>

      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-white via-white to-white/0 flex justify-between items-center">
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          disabled={!isValid}
          className="bg-[#a855f7] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none" 
          onClick={() => onNext({ familyName, members })}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
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
                className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'border-[#7c3aed] bg-[#7c3aed]/5 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}
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
                     <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-[#f8fafc]/0 flex justify-between items-center">
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all" 
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
          <div className="bg-[#f8f9ff] border border-slate-200 rounded-3xl p-5 flex gap-4 shadow-sm mb-6">
             <div className="w-14 h-14 bg-[#7c3aed] rounded-2xl flex items-center justify-center shrink-0 text-white shadow-md">
                <Lock className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-bold text-[#0f172a] mb-1.5 text-[15px]">Calendar Sync (Plus Plan)</h3>
                <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">Upgrade to Plus to connect Google Calendar, Outlook, and Apple Calendar.</p>
                <button onClick={handleLearnMore} className="bg-[#7c3aed] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-purple-500/20 active:scale-95 transition-all">
                  Learn More
                </button>
             </div>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
             {['Google Calendar', 'Outlook', 'Apple Calendar'].map((cal, i) => (
               <div key={cal} className="border border-slate-200 bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
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
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all" 
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
                  className={`border-2 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all active:scale-[0.98] ${
                    isSelected ? 'border-amber-400 bg-white' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-300'
                  }`}>
                    {isSelected ? <Check className="w-4 h-4" strokeWidth={3} /> : <Plus className="w-4 h-4" />}
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
                  className={`border-2 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all active:scale-[0.98] ${
                    isSelected ? 'border-sky-400 bg-white' : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-sky-400 text-white' : 'bg-slate-100 text-slate-300'
                  }`}>
                    {isSelected ? <Check className="w-4 h-4" strokeWidth={3} /> : <Plus className="w-4 h-4" />}
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
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all" 
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
                className={`border-2 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                  isSelected ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-100 bg-white hover:border-slate-200'
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
                  {isSelected ? <Check className="w-4 h-4" strokeWidth={3} /> : <Plus className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-[#f8fafc]/0 flex justify-between items-center">
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          disabled={!isValid}
          className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
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
        <div className="bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-3xl p-5 mb-8">
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[#0f172a] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all font-medium"
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[#0f172a] focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all font-medium"
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
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-[13px] transition-all border-2 ${
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
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          className="bg-[#7c3aed] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all" 
          onClick={() => onNext({ quietHoursFrom: quietFrom, quietHoursTo: quietTo, reminderIntensity: intensity })}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// 8. You're All Set! Screen (Final Confirmation)
const AllSetScreen = ({ onBack, onFinish }) => {
  const { state } = useContext(AppContext);
  const kids = state.users.filter(u => u.role !== 'PARENT');

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar flex flex-col items-center text-center mt-4">
        
        <div className="w-20 h-20 bg-[#2dd4bf] rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-200">
          <Sparkles className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">You're All Set! 🎉</h1>
        <p className="text-slate-500 text-[15px] mb-8 font-medium">Welcome to FamilyOS, {state.family.name}!</p>

        <div className="bg-white rounded-[1.5rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-5 mb-8 w-full text-left">
          <h3 className="font-bold text-[#0f172a] mb-4 text-[15px]">Your family is ready:</h3>
          <div className="flex flex-wrap gap-3">
            {kids.map((kid, i) => (
              <div key={kid.id} className="border border-slate-100 rounded-2xl p-2 pr-4 flex items-center gap-3 shadow-sm bg-[#f8fafc]/50">
                <div className="text-2xl w-8 h-8 flex items-center justify-center">
                  {['👦', '👧', '👶', '👨', '👩'][i % 5]}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[14px] text-[#0f172a]">{kid.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kid.role}</span>
                </div>
              </div>
            ))}
            {kids.length === 0 && (
               <span className="text-sm text-slate-500 font-medium">Ready to invite members!</span>
            )}
          </div>
        </div>

        <div className="space-y-4 w-full pl-2 text-left">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-[#10b981]" strokeWidth={3}/>
            <span className="text-[#10b981] text-[15px] font-medium">Tasks & rewards configured</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-[#10b981]" strokeWidth={3}/>
            <span className="text-[#10b981] text-[15px] font-medium">Family chat ready</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-[#10b981]" strokeWidth={3}/>
            <span className="text-[#10b981] text-[15px] font-medium">Calendar events created</span>
          </div>
        </div>

      </div>

      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-[#f8fafc]/0 flex justify-between items-center">
        <button onClick={onBack} className="text-[#64748b] font-bold text-sm flex items-center gap-1 hover:text-[#0f172a] transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button 
          className="bg-[#2dd4bf] hover:bg-[#10b981] text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all" 
          onClick={onFinish}
        >
          <Sparkles className="w-5 h-5" /> Launch FamilyOS
        </button>
      </div>
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
    if (usageCount >= entitlements.aiActionsMonthly) {
      showToast("AI limit reached for your plan.", "error");
      return;
    }

    const kids = state.users.filter(u => u.role !== 'PARENT');
    if (kids.length === 0) {
      showToast("No kids available to assign tasks to!", "error");
      return;
    }

    setIsGenerating(true);

    try {
      const kidsContext = kids.map(k => `ID: ${k.id}, Name: ${k.name}, Age/Role indicator: ${k.role}`).join('\n');
      const aiResponse = await generateSmartPlan(kidsContext);

      if (aiResponse && aiResponse.tasks) {
        const aiTasks = aiResponse.tasks.map(t => ({
          ...t,
          id: Math.random().toString(),
          familyId: state.family.id,
          status: 'TODO',
          dueAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString()
        }));

        dispatch({ type: 'GENERATE_AI_PLAN', payload: aiTasks });
        showToast("Smart routine generated successfully!", "success", "FamilyOS AI");
      } else {
        throw new Error("Invalid format returned from AI.");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      showToast("Failed to generate AI plan. Please try again.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-32 space-y-8 animate-in fade-in duration-500">
      
      {/* Dynamic Header */}
      <header className="flex justify-between items-start">
        <div>
          <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <GreetingIcon className="w-4 h-4"/> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {greeting},<br/>{currentUser?.name.split(' ')[0]}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {!isParent && (
            <div className="flex flex-col items-end gap-2 mr-2">
              <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm text-sm">
                <Flame className="w-4 h-4 fill-white" /> {currentUser?.streak || 0} Days
              </div>
            </div>
          )}
          <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border-2 border-slate-100">
              {currentUser?.avatar || '👤'}
            </div>
            {isParent && needsApproval.length > 0 && (
               <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-slate-50 rounded-full animate-pulse"></span>
            )}
          </div>
        </div>
      </header>

      {/* PARENT DASHBOARD */}
      {isParent && (
        <>
          {/* Quick Stats Glance */}
          <div className="grid grid-cols-3 gap-3">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${needsApproval.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                 <Bell className="w-4 h-4" />
               </div>
               <span className="text-2xl font-black text-slate-900 leading-none">{needsApproval.length}</span>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Review</span>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
               <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                 <ListTodo className="w-4 h-4" />
               </div>
               <span className="text-2xl font-black text-slate-900 leading-none">{activeTasksCount}</span>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tasks</span>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
               <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                 <CalendarIcon className="w-4 h-4" />
               </div>
               <span className="text-2xl font-black text-slate-900 leading-none">{todayEventsCount}</span>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Events</span>
             </div>
          </div>

          {/* Action Required Queue */}
          {(needsApproval.length > 0 || pendingEvents.length > 0) && (
            <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
              <div className="flex items-center gap-2 mb-4 text-amber-600 font-extrabold tracking-wide uppercase text-sm">
                <Activity className="w-5 h-5 animate-pulse" /> Action Required
              </div>
              <div className="space-y-3">
                {needsApproval.map(task => {
                  const kid = state.users.find(u => u.id === task.assignedToUserId);
                  return (
                    <Card key={task.id} className="border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50 to-white">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{kid?.avatar || '👤'}</div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-[15px]">{task.title}</h4>
                            <p className="text-xs font-semibold text-slate-500">{kid?.name.split(' ')[0]} • <span className="text-indigo-600">{task.points} pts</span></p>
                          </div>
                        </div>
                        <Button variant="primary" className="w-auto py-2 px-5 text-sm bg-amber-500 hover:bg-amber-600 shadow-sm" onClick={() => {
                            dispatch({ type: 'APPROVE_TASK', payload: task.id });
                            showToast(`Approved ${kid?.name.split(' ')[0]}'s task!`, 'success', 'Task Approved');
                        }}>
                          Approve
                        </Button>
                      </div>
                    </Card>
                  )
                })}
                {pendingEvents.map(event => {
                  const kid = state.users.find(u => u.id === event.ownerUserId);
                  return (
                    <Card key={event.id} className="border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50 to-white">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{kid?.avatar || '👤'}</div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-[15px]">{event.title}</h4>
                            <p className="text-xs font-semibold text-slate-500">{kid?.name.split(' ')[0]} requested event</p>
                          </div>
                        </div>
                        <Button variant="primary" className="w-auto py-2 px-5 text-sm bg-amber-500 hover:bg-amber-600 shadow-sm" onClick={() => {
                            dispatch({ type: 'APPROVE_EVENT', payload: event.id });
                            showToast('Event approved!', 'success', 'Calendar Updated');
                        }}>
                          Approve
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

          {/* Premium Widgets */}
          <div className="grid grid-cols-2 gap-4">
            <PremiumGate feature="automations" fallback={
              <Card className="col-span-2 bg-slate-50 border-dashed flex flex-col items-center justify-center py-8 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => dispatch({ type: 'CHANGE_PLAN', payload: 'PRO' })}>
                 <div className="bg-white p-3 rounded-2xl shadow-sm mb-4 relative">
                   <UtensilsCrossed className="w-6 h-6 text-slate-400" />
                   <Lock className="w-4 h-4 text-[#7c3aed] absolute -bottom-1 -right-1" />
                 </div>
                 <h3 className="font-bold text-slate-900 text-[15px]">Smart Meal Planner</h3>
                 <p className="text-[13px] text-slate-500 mb-3 mt-1 px-8">PRO AI syncs with your calendar to plan quick meals on busy sports nights.</p>
                 <span className="text-[13px] font-black text-[#7c3aed] uppercase tracking-wider">Unlock Feature &rarr;</span>
               </Card>
            }>
              <Card className="col-span-2 bg-gradient-to-r from-[#ecfdf5] to-[#f0fdfa] border-[#a7f3d0] relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => dispatch({ type: 'CHANGE_TAB', payload: 'meals' })}>
                 <ChefHat className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-emerald-100 opacity-50 pointer-events-none" />
                 <div className="relative z-10">
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm uppercase tracking-wider">
                       <UtensilsCrossed className="w-4 h-4"/> Tonight's Dinner
                     </div>
                     <Badge variant="success">AI Planned</Badge>
                   </div>
                   <h4 className="font-black text-slate-900 text-xl tracking-tight">Taco Tuesday Setup</h4>
                   <p className="text-[14px] text-slate-600 mt-1.5 font-medium leading-relaxed max-w-[85%]">Prep takes 15 mins. Perfectly timed before Charlie's soccer game at 6 PM.</p>
                 </div>
              </Card>
            </PremiumGate>
          </div>
        </>
      )}

      {/* KID DASHBOARD */}
      {!isParent && (
        <div className="space-y-4">
           {/* Gamified Level Card */}
           <Card className="bg-slate-900 text-white border-none flex flex-col justify-between relative overflow-hidden shadow-xl shadow-slate-900/20 p-6">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[3rem] opacity-30 pointer-events-none"></div>
             <Target className="absolute right-[-10px] bottom-[-10px] w-32 h-32 text-white/5 pointer-events-none" />
             
             <div className="relative z-10 flex justify-between items-start">
               <div>
                 <p className="text-[11px] text-indigo-300 font-black uppercase tracking-widest mb-1">Current Rank</p>
                 <h2 className="text-2xl font-black tracking-tight text-white mb-4">Chore Ninja</h2>
               </div>
               <div className="bg-indigo-500/30 border border-indigo-400/50 px-4 py-2 rounded-2xl backdrop-blur-sm flex items-center gap-2">
                 <Trophy className="w-5 h-5 text-yellow-400"/>
                 <span className="font-bold">Lvl {currentUser?.level || 1}</span>
               </div>
             </div>
             
             <div className="relative z-10 mt-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                  <span>{userPoints} pts</span>
                  <span>1000 pts to Lvl {(currentUser?.level || 1) + 1}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 shadow-inner overflow-hidden border border-slate-700">
                  <div className="bg-gradient-to-r from-indigo-500 to-violet-400 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (userPoints / 1000) * 100)}%` }} />
                </div>
             </div>
           </Card>
           
           {/* Next Reward Target */}
           <Card className="bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white border-none relative overflow-hidden p-5 shadow-lg shadow-purple-900/20">
             <Star className="absolute left-[-10px] top-[-10px] w-24 h-24 text-white/10 pointer-events-none" />
             <div className="relative z-10 flex items-center gap-4">
               <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
                 🍕
               </div>
               <div className="flex-1">
                 <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-[11px] uppercase tracking-widest text-purple-200">Next Reward</span>
                    <span className="font-black text-sm">{userPoints} / 500</span>
                 </div>
                 <h3 className="text-lg font-black tracking-tight mb-2">Pizza Night</h3>
                 <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden shadow-inner">
                   <div className="bg-emerald-400 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${Math.min(100, (userPoints / 500) * 100)}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                   </div>
                 </div>
               </div>
             </div>
           </Card>
        </div>
      )}

      {/* SHARED: Tasks Overview */}
      <section className="animate-in slide-in-from-bottom-4 duration-500 delay-200">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{isParent ? 'Family Focus' : 'My Tasks'}</h2>
          <button className="text-[13px] font-bold text-[#7c3aed] hover:opacity-80 transition-opacity bg-[#7c3aed]/10 px-3 py-1 rounded-lg">View All</button>
        </div>
        
        <div className="space-y-3">
          {(isParent ? state.tasks.filter(t => t.status !== 'DONE') : myTasks).slice(0, 4).map(task => {
            const kid = state.users.find(u => u.id === task.assignedToUserId);
            const isChore = task.type === 'CHORE';
            return (
              <Card key={task.id} className={`flex items-center gap-4 hover:shadow-md transition-all cursor-pointer border-l-4 ${isChore ? 'border-l-emerald-400' : 'border-l-sky-400'}`}>
                <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 shadow-sm ${isChore ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                  {isChore ? <CheckSquare className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#0f172a] text-[15px] truncate mb-0.5">{task.title}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={isChore ? 'success' : 'premium'}>{task.points} pts</Badge>
                    {isParent && <span className="text-[12px] font-semibold text-slate-500 truncate flex items-center gap-1"><UserCircle className="w-3 h-3"/>{kid?.name.split(' ')[0]}</span>}
                  </div>
                </div>
                {!isParent && (task.status === 'TODO' || task.status === 'IN_PROGRESS') && (
                  <button 
                    onClick={(e) => {
                       e.stopPropagation();
                       dispatch({ type: 'COMPLETE_TASK', payload: task.id });
                       showToast(task.proofRequired ? 'Sent to parents for review!' : `Earned ${task.points} points!`, 'success', task.proofRequired ? 'Approval Needed' : 'Task Complete!');
                    }}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isChore ? 'border-slate-200 text-slate-300 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50' : 'border-slate-200 text-slate-300 hover:border-sky-500 hover:text-sky-500 hover:bg-sky-50'}`}
                  >
                    <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                )}
                {task.status === 'NEEDS_APPROVAL' && (
                   <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest bg-amber-50 px-2 py-1 rounded-md">Review</span>
                )}
              </Card>
            )
          })}
          
          {(!isParent && myTasks.length === 0) && (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
               <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Trophy className="w-8 h-8 text-emerald-500" />
               </div>
               <h3 className="font-black text-slate-900 text-lg mb-1">All Caught Up!</h3>
               <p className="text-[13px] font-medium text-slate-500">You've crushed all your tasks for today.</p>
            </div>
          )}
          {(isParent && state.tasks.filter(t => t.status !== 'DONE').length === 0) && (
             <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <h3 className="font-bold text-slate-700">No active tasks.</h3>
               <p className="text-[13px] text-slate-500 mt-1">Tap below to generate a smart plan.</p>
             </div>
          )}
        </div>
      </section>

      {/* Quick AI Action (Gated) */}
      <section className="animate-in slide-in-from-bottom-4 duration-500 delay-300">
         <PremiumGate feature="aiActionsMonthly" fallback={
           <Card className="bg-slate-50 border-dashed flex flex-col items-center justify-center py-8 text-center shadow-inner">
             <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
               <BrainCircuit className="w-6 h-6 text-slate-400" />
             </div>
             <h3 className="font-bold text-slate-900 text-[15px]">AI Daily Planning</h3>
             <p className="text-[13px] text-slate-500 mb-4 mt-1 px-6 leading-relaxed">Upgrade to PLUS to let FamilyOS auto-assign chores and homework based on kids' schedules.</p>
             <Button variant="outline" className="w-auto py-2.5 px-6 text-sm" onClick={() => dispatch({ type: 'CHANGE_PLAN', payload: 'PLUS' })}>View Plans</Button>
           </Card>
         }>
           <div className="relative group cursor-pointer" onClick={isGenerating ? undefined : handleGeneratePlan}>
             {/* Animated ambient glow behind the card */}
             <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
             
             <Card className="relative bg-white border border-slate-100 shadow-xl overflow-hidden p-5 flex items-center gap-5">
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-100 to-transparent rounded-bl-full opacity-50"></div>
               
               <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl shadow-inner flex items-center justify-center shrink-0 relative z-10">
                 <Sparkles className={`w-7 h-7 ${isGenerating ? 'animate-spin' : ''}`} />
               </div>
               
               <div className="flex-1 relative z-10">
                 <h4 className="font-black text-slate-900 text-lg tracking-tight mb-0.5">Auto-Generate Plan</h4>
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded-md">1 Action</span>
                   <span className="text-xs text-slate-400 font-medium">Instantly assign tasks</span>
                 </div>
               </div>
               
               <button 
                 disabled={isGenerating}
                 className="relative z-10 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition-all shadow-md active:scale-95 shrink-0"
               >
                 {isGenerating ? 'Working...' : 'Run'}
               </button>
             </Card>
           </div>
         </PremiumGate>
      </section>
    </div>
  );
};

const TasksView = () => {
  const { state, currentUser, dispatch, showToast } = useContext(AppContext);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setModalOpen] = useState(false);
  const isParent = currentUser?.role === 'PARENT';

  // New Task Form State
  const [newTask, setNewTask] = useState({ title: '', points: 50, assignedToUserId: state.users.find(u => u.role !== 'PARENT')?.id || '', type: 'CHORE', proofRequired: true });

  const displayTasks = state.tasks.filter(t => {
    const userMatch = isParent ? true : t.assignedToUserId === currentUser?.id;
    const statusMatch = statusFilter === 'ALL' ? true : t.status === statusFilter;
    return userMatch && statusMatch;
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    dispatch({ 
      type: 'CREATE_TASK', 
      payload: { ...newTask, familyId: state.family.id, dueAt: new Date(Date.now() + 86400000).toISOString() }
    });
    setModalOpen(false);
    setNewTask({ ...newTask, title: '' }); // reset title
    showToast('Task successfully created!');
  };

  const filterTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'TODO', label: 'To Do' },
    { id: 'IN_PROGRESS', label: 'Active' },
    { id: 'NEEDS_APPROVAL', label: 'Review' },
    { id: 'DONE', label: 'Done' }
  ];

  return (
    <div className="p-4 pb-24 h-full flex flex-col relative">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tasks</h1>
      
      {/* Scrollable Status Filter Bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar shrink-0 pb-2">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
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
                <Badge variant={task.type === 'CHORE' ? 'default' : task.type === 'HOMEWORK' ? 'premium' : 'warning'}>
                  {task.type}
                </Badge>
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
                  <Button variant="secondary" className="w-auto px-4 py-1.5 text-xs" onClick={() => {
                    dispatch({ type: 'START_TASK', payload: task.id });
                    showToast('Task started!', 'success');
                  }}>
                    Start
                  </Button>
                  <Button variant="outline" className="w-auto px-4 py-1.5 text-xs" onClick={() => {
                     dispatch({ type: 'COMPLETE_TASK', payload: task.id });
                     showToast(task.proofRequired ? 'Sent to parents for review!' : `Completed! Earned ${task.points} points.`, 'success', task.proofRequired ? 'Approval Needed' : 'Task Complete!');
                  }}>
                    Finish
                  </Button>
                </>
              )}
              {!isParent && task.status === 'IN_PROGRESS' && (
                <Button variant="primary" className="w-auto px-4 py-1.5 text-xs" onClick={() => {
                   dispatch({ type: 'COMPLETE_TASK', payload: task.id });
                   showToast(task.proofRequired ? 'Sent to parents for review!' : `Completed! Earned ${task.points} points.`, 'success', task.proofRequired ? 'Approval Needed' : 'Task Complete!');
                }}>
                  Finish
                </Button>
              )}
              {isParent && task.status === 'NEEDS_APPROVAL' && (
                <Button variant="primary" className="w-auto px-4 py-1.5 text-xs" onClick={() => {
                   dispatch({ type: 'APPROVE_TASK', payload: task.id });
                   showToast('Task approved! Points awarded.', 'success', 'Points Awarded');
                }}>
                  Approve
                </Button>
              )}
              {isParent && (
                <button 
                  onClick={() => {
                    dispatch({ type: 'DELETE_TASK', payload: task.id });
                    showToast('Task deleted');
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </Card>
        ))}
        {displayTasks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No tasks found for this view.</p>
          </div>
        )}
      </div>

      {isParent && (
        <Button className="mt-4 shrink-0" onClick={() => setModalOpen(true)}>
          <Plus className="w-5 h-5" /> Create Task
        </Button>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Task Title</label>
            <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g., Clean the garage" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Task Type</label>
              <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500">
                <option value="CHORE">Chore</option>
                <option value="HOMEWORK">Homework</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Points</label>
              <input type="number" value={newTask.points} onChange={e => setNewTask({...newTask, points: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Assign To</label>
            <select value={newTask.assignedToUserId} onChange={e => setNewTask({...newTask, assignedToUserId: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500">
              {state.users.filter(u => u.role !== 'PARENT').map(kid => (
                <option key={kid.id} value={kid.id}>{kid.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
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

const MealsView = () => {
  const { state, dispatch, showToast, entitlements, usageCount } = useContext(AppContext);
  const [activeSubTab, setActiveSubTab] = useState('PLAN'); // PLAN, RECIPES, LIST
  const isParent = true; // Assume parents manage this for simplicity in demo
  
  // Sub-View States
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewRecipe, setViewRecipe] = useState(null);
  const [planModalDate, setPlanModalDate] = useState(null);
  const [newItem, setNewItem] = useState('');

  // 1. Handlers for AI Generation
  const handleGenerateRecipe = async (e) => {
    e.preventDefault();
    if (usageCount >= entitlements.aiActionsMonthly) {
      showToast("AI limit reached for your plan.", "error");
      return;
    }

    setIsGenerating(true);
    try {
      const data = await generateSmartRecipe(aiPrompt);
      const newRecipe = {
        id: Math.random().toString(),
        title: data.title,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        ingredients: data.ingredients,
        instructions: data.instructions,
        isAIGenerated: true
      };
      dispatch({ type: 'ADD_RECIPE', payload: newRecipe });
      dispatch({ type: 'INCREMENT_AI' });
      showToast('AI Recipe created!', 'success', 'Recipe Saved');
      setAiModalOpen(false);
      setAiPrompt('');
      setViewRecipe(newRecipe); // open the new recipe immediately
    } catch (err) {
      console.error(err);
      showToast('Failed to generate recipe.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Handlers for Shopping List
  const handleAddGroceries = (ingredients) => {
    const newItems = ingredients.map(ing => ({
      id: Math.random().toString(),
      name: ing,
      isChecked: false
    }));
    dispatch({ type: 'ADD_MULTIPLE_SHOPPING_ITEMS', payload: newItems });
    showToast('Ingredients added to list!', 'success');
  };

  const submitShoppingItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    dispatch({ type: 'ADD_SHOPPING_ITEM', payload: newItem.trim() });
    setNewItem('');
  };

  // Helpers for Plan View
  const today = new Date();
  const weekDays = [0, 1, 2, 3].map(offset => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return {
      dateStr: d.toISOString().split('T')[0],
      display: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    };
  });

  const activeGroceries = state.shoppingList.filter(i => !i.isChecked);
  const completedGroceries = state.shoppingList.filter(i => i.isChecked);

  return (
    <div className="p-4 sm:p-6 pb-24 h-full flex flex-col relative animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Meals</h1>
      </div>
      
      {/* Sub-Tabs */}
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
                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* --- PLAN VIEW --- */}
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
                      <button 
                        onClick={() => dispatch({ type: 'REMOVE_FROM_MEAL_PLAN', payload: plan.id })}
                        className="p-2 text-slate-300 hover:text-rose-500 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Card>
                  ) : (
                    <button 
                      onClick={() => setPlanModalDate(day.dateStr)}
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add Dinner
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* --- RECIPES VIEW --- */}
        {activeSubTab === 'RECIPES' && (
          <div className="space-y-4">
            <PremiumGate feature="automations" fallback={
               <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none p-5 relative overflow-hidden cursor-pointer" onClick={() => dispatch({ type: 'CHANGE_PLAN', payload: 'PRO' })}>
                  <Lock className="absolute right-4 top-4 w-5 h-5 text-white/20" />
                  <h3 className="font-black text-lg mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400"/> AI Kitchen</h3>
                  <p className="text-sm text-slate-300 mb-3 max-w-[85%]">Upgrade to PRO to generate recipes instantly from ingredients you already have.</p>
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Unlock Feature &rarr;</span>
               </Card>
            }>
               <Card onClick={() => setAiModalOpen(true)} className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none p-5 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
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
            </div>
          </div>
        )}

        {/* --- GROCERIES VIEW --- */}
        {activeSubTab === 'LIST' && (
          <div className="space-y-6">
            <form onSubmit={submitShoppingItem} className="flex gap-2">
              <input 
                type="text" 
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                placeholder="Add item..." 
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
              />
              <button type="submit" disabled={!newItem.trim()} className="bg-slate-900 text-white px-4 rounded-xl disabled:opacity-50 transition-opacity">
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div>
              <div className="space-y-2">
                {activeGroceries.map(item => (
                  <div key={item.id} onClick={() => dispatch({ type: 'TOGGLE_SHOPPING_ITEM', payload: item.id })} className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                    <div className="w-6 h-6 rounded-md border-2 border-slate-300 flex items-center justify-center shrink-0"></div>
                    <span className="font-semibold text-slate-700 text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
              
              {completedGroceries.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-end mb-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Completed</h3>
                    <button onClick={() => dispatch({ type: 'CLEAR_COMPLETED_SHOPPING' })} className="text-xs font-bold text-rose-500 hover:opacity-80">Clear All</button>
                  </div>
                  <div className="space-y-2 opacity-60">
                    {completedGroceries.map(item => (
                      <div key={item.id} onClick={() => dispatch({ type: 'TOGGLE_SHOPPING_ITEM', payload: item.id })} className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 cursor-pointer">
                        <div className="w-6 h-6 rounded-md border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                           <Check className="w-4 h-4" strokeWidth={3} />
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

      {/* --- MODALS --- */}
      
      {/* 1. Generate AI Recipe Modal */}
      <Modal isOpen={isAiModalOpen} onClose={() => !isGenerating && setAiModalOpen(false)} title={<span className="flex items-center gap-2 text-indigo-600"><Sparkles className="w-5 h-5"/> AI Kitchen</span>} fullHeight>
        <div className="flex flex-col h-full relative">
           <div className="flex-1 overflow-y-auto pb-6">
             <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed">
               Tell me what ingredients you have, how much time you have, or what the kids are craving, and I'll create a custom recipe instantly.
             </p>
             <form onSubmit={handleGenerateRecipe} className="space-y-4">
               <textarea 
                 rows="4"
                 value={aiPrompt}
                 onChange={e => setAiPrompt(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none"
                 placeholder="e.g., We have chicken breast, rice, and broccoli. I need a 30-minute dinner that isn't spicy."
               />
               <Button type="submit" disabled={!aiPrompt.trim() || isGenerating} className="py-3.5 shadow-md">
                 {isGenerating ? 'Cooking up ideas...' : 'Generate Recipe'}
               </Button>
             </form>
           </div>
        </div>
      </Modal>

      {/* 2. View Recipe Modal */}
      <Modal isOpen={!!viewRecipe} onClose={() => setViewRecipe(null)} title={viewRecipe?.title} fullHeight>
        {viewRecipe && (
          <div className="flex flex-col h-full relative space-y-6 pb-12">
             <div className="flex gap-4">
               <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-center flex-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prep</p>
                 <p className="font-black text-slate-800">{viewRecipe.prepTime}</p>
               </div>
               <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-center flex-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cook</p>
                 <p className="font-black text-slate-800">{viewRecipe.cookTime}</p>
               </div>
             </div>

             <div>
               <h3 className="font-bold text-slate-900 mb-3 flex items-center justify-between">
                 Ingredients
                 <button onClick={() => { handleAddGroceries(viewRecipe.ingredients); setViewRecipe(null); setActiveSubTab('LIST'); }} className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95">
                   <Plus className="w-3 h-3"/> Add to List
                 </button>
               </h3>
               <ul className="space-y-2">
                 {viewRecipe.ingredients.map((ing, i) => (
                   <li key={i} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {ing}
                   </li>
                 ))}
               </ul>
             </div>

             <div>
               <h3 className="font-bold text-slate-900 mb-3">Instructions</h3>
               <div className="space-y-3">
                 {viewRecipe.instructions.map((step, i) => (
                   <div key={i} className="flex gap-3">
                     <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
                     <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                   </div>
                 ))}
               </div>
             </div>

             <Button variant="outline" className="w-full mt-6 text-rose-500 border-rose-100 hover:bg-rose-50" onClick={() => {
               dispatch({ type: 'DELETE_RECIPE', payload: viewRecipe.id });
               setViewRecipe(null);
               showToast('Recipe deleted');
             }}>
               Delete Recipe
             </Button>
          </div>
        )}
      </Modal>

      {/* 3. Add to Plan Modal */}
      <Modal isOpen={!!planModalDate} onClose={() => setPlanModalDate(null)} title="Select a Recipe">
        <div className="space-y-3 pb-6">
          {state.recipes.length === 0 && (
             <p className="text-center text-sm text-slate-500 py-8">No recipes saved. Generate one first!</p>
          )}
          {state.recipes.map(recipe => (
            <div 
              key={recipe.id}
              onClick={() => {
                dispatch({ type: 'ADD_TO_MEAL_PLAN', payload: { id: Math.random().toString(), date: planModalDate, type: 'Dinner', recipeId: recipe.id } });
                setPlanModalDate(null);
                showToast('Meal added to plan!');
              }}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 cursor-pointer transition-colors active:scale-[0.98]"
            >
              <div className="text-2xl w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                {recipe.isAIGenerated ? '✨' : '🍲'}
              </div>
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

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: Math.random().toString(), familyId: state.family.id, senderId: currentUser.id, channelId: 'FAMILY',
        text: msgText, isTask: false, isEvent: false, createdAt: new Date().toISOString()
      }
    });
    setMsgText('');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white p-4 border-b border-slate-100 shadow-sm z-10">
        <h1 className="text-xl font-bold text-slate-900">Family Chat</h1>
        <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1 mt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> {state.users.length} Online
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {state.messages.map(msg => {
          const isMe = msg.senderId === currentUser?.id;
          const sender = state.users.find(u => u.id === msg.senderId);
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && <span className="text-xs text-slate-500 mb-1 ml-1">{sender?.name.split(' ')[0]}</span>}
              <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-sm'}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-16 sm:bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-20">
        <form onSubmit={handleSend} className="flex gap-2">
          <button type="button" className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
            <Plus className="w-6 h-6" />
          </button>
          <input 
            type="text" 
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            placeholder="Message family..." 
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" disabled={!msgText.trim()} className="p-3 bg-indigo-600 text-white rounded-xl disabled:opacity-50 transition-opacity">
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
    <div className="p-4 pb-24 h-full flex flex-col">
      <div className="bg-indigo-600 rounded-3xl p-6 text-white mb-8 shadow-lg">
        <h2 className="text-indigo-200 font-medium mb-1">{isParent ? 'Family Points System' : 'My Balance'}</h2>
        <div className="text-4xl font-extrabold flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-yellow-300" />
          {isParent ? 'Manage Store' : `${userPoints} pts`}
        </div>
        {!isParent && <p className="text-indigo-100 text-sm">Keep completing tasks to earn more!</p>}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-900">Reward Catalog</h3>
        {isParent && <button onClick={() => setModalOpen(true)} className="text-indigo-600 font-semibold text-sm flex items-center"><Plus className="w-4 h-4"/> Add</button>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {state.rewards.map(reward => (
          <Card key={reward.id} className="flex flex-col items-center text-center p-6 border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
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
                 <Button variant="secondary" className="flex-1 py-2 text-sm">Edit</Button>
                 <button 
                   onClick={() => {
                     dispatch({ type: 'DELETE_REWARD', payload: reward.id });
                     showToast('Reward deleted');
                   }}
                   className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-xl transition-colors"
                 >
                   <Trash2 className="w-5 h-5" />
                 </button>
               </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add Reward Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Create New Reward">
        <form onSubmit={handleAddReward} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Reward Title</label>
            <input required type="text" value={newReward.title} onChange={e => setNewReward({...newReward, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g., Ice Cream Trip" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Cost (Points)</label>
            <input required type="number" value={newReward.costPoints} onChange={e => setNewReward({...newReward, costPoints: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
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
      id: 'u' + Math.random().toString(36).substr(2, 9),
      familyId: state.family.id,
      name: newMember.name,
      role: newMember.role,
      level: newMember.role !== 'PARENT' ? 1 : null,
      streak: newMember.role !== 'PARENT' ? 0 : null,
      avatar: avatars[state.users.length % avatars.length]
    };
    dispatch({ type: 'ADD_MEMBER', payload: member });
    setNewMember({ name: '', role: 'CHILD' });
    setMembersModalOpen(false);
    showToast(`${member.name} added to the family!`);
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      showToast("Browser does not support notifications", "error");
      return;
    }
    
    if (pushEnabled) {
      dispatch({ type: 'TOGGLE_PUSH_NOTIFICATIONS', payload: false });
      showToast("Push notifications disabled");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        dispatch({ type: 'TOGGLE_PUSH_NOTIFICATIONS', payload: true });
        new Notification("FamilyOS", { body: "Push notifications enabled!", icon: "✨" });
        showToast("Push notifications enabled!");
      } else {
        showToast("Permission denied by browser", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error requesting permissions", "error");
    }
  };

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Subscription</h2>
        <Card className="border-indigo-100 overflow-hidden p-0 relative">
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
              <Button onClick={() => setStripeModalOpen(true)} variant="premium" className="py-3 shadow-md shadow-violet-500/20 active:scale-95">
                Upgrade to PRO
              </Button>
            ) : (
              <Button variant="outline" className="py-3 bg-white text-slate-700 active:scale-95">
                Manage Subscription
              </Button>
            )}
          </div>
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">AI Usage</h2>
        <Card>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-slate-700">Monthly Actions</span>
            <span className="text-slate-500">{usageCount} / {entitlements.aiActionsMonthly === Infinity ? 'Unlimited' : entitlements.aiActionsMonthly}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-indigo-600 rounded-full h-2 transition-all" style={{ width: `${Math.min(100, (usageCount / (entitlements.aiActionsMonthly === Infinity ? usageCount+1 : entitlements.aiActionsMonthly)) * 100)}%` }} />
          </div>
        </Card>
      </section>
      
      <section className="space-y-3 text-slate-600">
         <Card onClick={requestNotificationPermission} className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50">
           <div className="flex items-center gap-3">
             <Smartphone className="w-5 h-5"/> Push Notifications
           </div>
           <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${pushEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
             <div className={`w-4 h-4 bg-white rounded-full transition-transform ${pushEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
           </div>
         </Card>
         <Card onClick={() => setMembersModalOpen(true)} className="flex items-center gap-3 py-3 cursor-pointer hover:bg-slate-50"><Users className="w-5 h-5"/> Manage Members</Card>
         <Card className="flex items-center gap-3 py-3 cursor-pointer hover:bg-slate-50"><ShieldCheck className="w-5 h-5"/> Parental Controls</Card>
      </section>

      {/* Modals */}
      <StripeCheckoutModal isOpen={isStripeModalOpen} onClose={() => setStripeModalOpen(false)} />

      {/* Manage Members Modal */}
      <Modal isOpen={isMembersModalOpen} onClose={() => setMembersModalOpen(false)} title="Manage Members" fullHeight>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Current Members</h3>
            <div className="space-y-3">
              {state.users.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">{u.avatar}</div>
                    <div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</p>
                    </div>
                  </div>
                  {u.role !== 'PARENT' && (
                     <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Lvl {u.level}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Add New Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                <input required type="text" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" placeholder="e.g., Alex" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                <select value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500">
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
  
  // Onboarding Setup State
  const [setupStep, setSetupStep] = useState('ROLE'); // ROLE, FAMILY, WEEK_STYLE, CALENDAR_SYNC, TASK_TEMPLATES, REWARD_TEMPLATES, NOTIFICATION_PREFS, ALL_SET
  const [setupRole, setSetupRole] = useState('PARENT');

  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Intercept dispatch in App to allow global tab changes
  const firestoreDispatch = (action) => {
    if (action.type === 'CHANGE_TAB') {
      setActiveTab(action.payload);
      return;
    }
    
    // Optimistic UI Update locally
    const nextState = appReducer(state, action);
    dispatch(action); 
    
    // Sync to Cloud
    if (user && action.type !== 'LOAD_STATE') {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'familyState', 'main');
      setDoc(docRef, nextState).catch(console.error);
    }
  };

  // Toast System Handler with Native Push Notifications
  const showToast = (message, type = 'success', nativeTitle = null) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    
    // Trigger OS-level notification if enabled
    if (nativeTitle && state.family.pushEnabled && "Notification" in window && Notification.permission === "granted") {
       new Notification(nativeTitle, { body: message });
    }
  };

  // 1. Firebase Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Data Sync
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'familyState', 'main');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        dispatch({ type: 'LOAD_STATE', payload: docSnap.data() });
        setIsLoaded(true);
      } else {
        // Initialize DB with seed data for new users
        setDoc(docRef, seedData).then(() => setIsLoaded(true)).catch(console.error);
      }
    }, (error) => {
      console.error("Firestore sync error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Splash Screen Timer linked to Database connection
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setShowSplash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  const currentUser = state.users.find(u => u.id === currentUserId);
  const entitlements = getEntitlements(state.family.plan);
  const usageCount = state.usageCounters[0].aiActionsUsed;
  
  // Calculate dynamic points for current user
  const userPoints = state.pointsLedger
    .filter(l => l.userId === currentUser?.id)
    .reduce((sum, l) => sum + l.amount, 0);

  const contextValue = {
    state, dispatch: firestoreDispatch, currentUser, setCurrentUserId, entitlements, usageCount, userPoints, showToast
  };

  // 1. Splash Screen
  if (showSplash) {
    return (
      <div className="w-full h-screen bg-slate-950 flex items-center justify-center font-sans text-slate-900 selection:bg-indigo-100">
        <CustomStyles />
        <div className="w-full max-w-md h-full sm:h-[850px] sm:rounded-[3rem] bg-slate-950 overflow-hidden relative flex flex-col items-center justify-center sm:border-[12px] border-slate-900 shadow-[0_0_100px_rgba(79,70,229,0.15)]">
           <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
             <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_0%,_#4f46e5_0%,_transparent_50%)] opacity-20 animate-pulse" style={{ animationDuration: '4s' }}></div>
             <div className="absolute bottom-[-20%] right-[-10%] w-[100%] h-[100%] bg-[radial-gradient(circle_at_100%_100%,_#8b5cf6_0%,_transparent_50%)] opacity-20 animate-pulse" style={{ animationDuration: '6s' }}></div>
           </div>
           <div className="flex flex-col items-center z-10">
              <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl border border-white/10 relative overflow-hidden animate-reveal">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                <Sparkles className="w-10 h-10 text-white animate-float" />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tight drop-shadow-sm animate-reveal" style={{ animationDelay: '0.2s', opacity: 0 }}>FamilyOS</h1>
              </div>
              <div className="overflow-hidden mt-4">
                <p className="text-indigo-200/80 font-medium text-sm tracking-widest uppercase animate-reveal" style={{ animationDelay: '0.4s', opacity: 0 }}>The Modern Family</p>
              </div>
           </div>
           <div className="absolute bottom-20 z-10 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-1/2 animate-[progress_1.5s_ease-in-out_infinite_alternate]"></div>
           </div>
           <style>{`
             @keyframes shimmer { 100% { transform: translateX(100%); } }
             @keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
           `}</style>
        </div>
      </div>
    );
  }

  // 2. Onboarding Flow
  if (!state.family.onboarded) {
    return (
      <AppContext.Provider value={contextValue}>
        <div className="w-full h-screen bg-[#f8fafc] sm:bg-slate-100 flex items-center justify-center font-sans text-slate-900">
          <div className="w-full max-w-md h-full sm:h-[850px] sm:rounded-[3rem] bg-white shadow-2xl overflow-hidden relative sm:border-[12px] border-slate-900">
            {setupStep === 'ROLE' && (
              <RoleSelectionScreen 
                onNext={(role) => {
                  setSetupRole(role);
                  setSetupStep('FAMILY');
                }} 
              />
            )}
            {setupStep === 'FAMILY' && (
              <FamilySetupScreen 
                initialRole={setupRole} 
                onBack={() => setSetupStep('ROLE')}
                onNext={(payload) => {
                  firestoreDispatch({ type: 'SETUP_FAMILY', payload });
                  const me = payload.members.find(m => m.isMe);
                  if (me) setCurrentUserId(me.id);
                  setSetupStep('WEEK_STYLE');
                }}
              />
            )}
            {setupStep === 'WEEK_STYLE' && (
              <WeekStyleScreen 
                onBack={() => setSetupStep('FAMILY')}
                onNext={(weekStyle) => {
                  firestoreDispatch({ type: 'UPDATE_WEEK_STYLE', payload: weekStyle });
                  setSetupStep('CALENDAR_SYNC');
                }}
              />
            )}
            {setupStep === 'CALENDAR_SYNC' && (
              <CalendarSyncScreen 
                onBack={() => setSetupStep('WEEK_STYLE')}
                onNext={() => setSetupStep('TASK_TEMPLATES')}
              />
            )}
            {setupStep === 'TASK_TEMPLATES' && (
              <TaskTemplatesScreen 
                onBack={() => setSetupStep('CALENDAR_SYNC')}
                onNext={(selectedTasks) => {
                  if (selectedTasks.length > 0) {
                    firestoreDispatch({ type: 'ADD_TEMPLATE_TASKS', payload: selectedTasks });
                  }
                  setSetupStep('REWARD_TEMPLATES');
                }}
              />
            )}
            {setupStep === 'REWARD_TEMPLATES' && (
              <RewardTemplatesScreen 
                onBack={() => setSetupStep('TASK_TEMPLATES')}
                onNext={(selectedRewards) => {
                  if (selectedRewards.length > 0) {
                    firestoreDispatch({ type: 'ADD_TEMPLATE_REWARDS', payload: selectedRewards });
                  }
                  setSetupStep('NOTIFICATION_PREFS');
                }}
              />
            )}
            {setupStep === 'NOTIFICATION_PREFS' && (
              <NotificationPrefsScreen 
                onBack={() => setSetupStep('REWARD_TEMPLATES')}
                onNext={(prefs) => {
                  firestoreDispatch({ type: 'UPDATE_NOTIFICATION_PREFS', payload: prefs });
                  setSetupStep('ALL_SET');
                }}
              />
            )}
            {setupStep === 'ALL_SET' && (
              <AllSetScreen 
                onBack={() => setSetupStep('NOTIFICATION_PREFS')}
                onFinish={() => {
                  firestoreDispatch({ type: 'COMPLETE_ONBOARDING' });
                }}
              />
            )}
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
        
        {/* Mobile Device Simulator Container */}
        <div className="w-full max-w-md h-full sm:h-[850px] sm:rounded-[3rem] bg-slate-50 shadow-2xl overflow-hidden relative flex flex-col sm:border-[12px] border-slate-900">
          
          {/* Top Bar / Dev Switcher */}
          <div className="bg-slate-900 text-white p-3 flex justify-between items-center text-xs z-50 shrink-0">
            <span className="font-bold tracking-widest text-slate-400">FamilyOS DEV</span>
            <select 
              className="bg-slate-800 text-white border-none outline-none rounded p-1"
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
            >
              {state.users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Main Scrollable Content */}
          <main className="flex-1 overflow-y-auto relative no-scrollbar">
             {renderScreen()}
          </main>

          {/* FLOATING ACTION BUTTON - Copilot Trigger */}
          <div className="absolute bottom-24 right-4 z-50">
            <button 
              onClick={() => setIsCopilotOpen(true)}
              className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Toast Notification Container */}
          <div className="absolute top-16 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
            {toasts.map(t => (
              <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-bold animate-in slide-in-from-top-4 fade-in duration-300 ${t.type === 'error' ? 'bg-slate-800 text-white' : 'bg-emerald-500 text-white'}`}>
                {t.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                {t.message}
              </div>
            ))}
          </div>

          {/* Copilot Chat Modal */}
          <CopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />

          {/* Bottom Navigation */}
          <nav className="bg-white border-t border-slate-200 px-1 sm:px-4 py-3 sm:py-4 flex justify-between items-center z-40 pb-safe sm:pb-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: 'home', icon: Home, label: 'Today' },
              { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
              { id: 'calendar', icon: CalendarIcon, label: 'Schedule' },
              { id: 'meals', icon: ChefHat, label: 'Meals' },
              { id: 'rewards', icon: Gift, label: 'Rewards' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 transition-all flex-1 min-w-[50px] ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'fill-indigo-50' : ''}`} />
                  <span className="text-[8px] sm:text-[10px] font-semibold tracking-wide">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

      </div>
    </AppContext.Provider>
  );
}
