import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  Settings, Home, CheckSquare, Calendar as CalendarIcon, 
  ChefHat, Gift, X, Plus, Bell, ChevronRight, Clock, 
  MapPin, Send, User, Check, Utensils, Star, Flame, 
  MoreVertical, Users, BellRing, CreditCard, LogOut,
  ShoppingCart, Loader2, Hourglass, ArrowRight,
  Layers, Wand2, Smartphone, Film, Ticket,
  MessageCircle, Smile, Image as ImageIcon
} from 'lucide-react';

// --- THEME CONTEXT ---
// This allows us to instantly morph the UI primitives based on the active user's role
const ThemeContext = createContext({ isChild: false, user: null });

// --- CUSTOM STYLES & KEYFRAMES ---
const CustomStyles = () => (
  <style>
    {`
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      
      @keyframes popIn {
        0% { transform: scale(0.95); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes confetti-fall {
        0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
      }

      @keyframes pulse-slow {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }

      .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
      
      .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
    `}
  </style>
);

// --- REUSABLE UI PRIMITIVES (Dynamically themed) ---
const Card = ({ children, className = '', onClick }) => {
  const { isChild } = useContext(ThemeContext);
  
  const baseClass = isChild 
    ? `bg-white/95 rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.06)] border-[4px] border-white ring-1 ring-slate-900/5 p-6` 
    : `bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 p-5`;

  return (
    <div 
      onClick={onClick} 
      className={`${baseClass} transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1 active:scale-[0.98]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const { isChild } = useContext(ThemeContext);

  const baseStyle = isChild
    ? "w-full font-bold rounded-[1.5rem] py-4 px-4 transition-all duration-200 active:scale-[0.96] flex items-center justify-center gap-2 relative shadow-[0_4px_0_rgb(0,0,0,0.12)] active:shadow-[0_0px_0_rgb(0,0,0,0)] active:translate-y-1 disabled:opacity-50"
    : "w-full font-semibold rounded-[1.25rem] py-3.5 px-4 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-50 disabled:pointer-events-none";

  const parentVariants = {
    primary: "bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800",
    secondary: "bg-white/80 backdrop-blur-md text-slate-800 hover:bg-white ring-1 ring-slate-900/10 shadow-sm",
    premium: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]",
    outline: "border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
  };

  const childVariants = {
    primary: "bg-sky-500 text-white hover:bg-sky-400 border-2 border-sky-600",
    secondary: "bg-white text-slate-800 border-2 border-slate-200",
    premium: "bg-amber-400 text-amber-900 hover:bg-amber-300 border-2 border-amber-500",
    outline: "bg-transparent border-2 border-slate-300 text-slate-700"
  };

  const variants = isChild ? childVariants : parentVariants;

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      <div className="relative z-10 flex items-center justify-center gap-2 tracking-wide">{children}</div>
      {!isChild && <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out pointer-events-none rounded-[1.25rem]" style={{ mixBlendMode: 'overlay' }}></div>}
    </button>
  );
};

const Badge = ({ children, variant = 'default', className = '' }) => {
  const { isChild } = useContext(ThemeContext);
  
  const variants = {
    default: "bg-slate-100 text-slate-700 ring-1 ring-slate-900/5",
    success: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-900/5",
    warning: "bg-amber-100 text-amber-800 ring-1 ring-amber-900/10",
    premium: "bg-purple-100 text-purple-700 ring-1 ring-purple-900/5",
  };

  return (
    <span className={`${isChild ? 'text-xs px-3 py-1.5 rounded-xl' : 'text-[10px] sm:text-xs px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm'} font-bold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// --- SLEEK APPLE-STYLE AVATAR COMPONENT ---
const Avatar = ({ user, size = 'md', className = '' }) => {
  if (!user) return null;
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl',
    xxl: 'w-28 h-28 text-5xl'
  };
  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br ${user.color} text-white font-medium shadow-inner ring-1 ring-white/30 ${sizes[size]} ${className}`}>
      {user.initials}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, fullHeight = false }) => {
  const { isChild } = useContext(ThemeContext);
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className={`${isChild ? 'bg-white rounded-t-[3rem] sm:rounded-[3rem] border-t-8 border-white/50' : 'bg-white/95 backdrop-blur-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem]'} w-full sm:w-[90%] max-w-md ${fullHeight ? 'h-[90%]' : 'max-h-[90%]'} sm:h-auto p-6 shadow-2xl flex flex-col ring-1 ring-slate-900/5 relative animate-pop-in cursor-default`}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6 sm:hidden opacity-60"></div>
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 bg-slate-100/80 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all hover:rotate-90 duration-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- CONFETTI ANIMATION ---
const Confetti = ({ active }) => {
  if (!active) return null;
  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-emerald-400', 'bg-amber-400', 'bg-pink-400'];
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex justify-center items-center">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-3 h-3 rounded-sm ${colors[i % colors.length]}`}
          style={{
            left: '50%',
            top: '50%',
            animation: `confetti-fall ${0.6 + Math.random() * 0.5}s ease-out forwards`,
            transformOrigin: 'center',
            transform: `translate(-50%, -50%)`,
            margin: `${(Math.random() - 0.5) * 200}px ${(Math.random() - 0.5) * 200}px`
          }}
        />
      ))}
    </div>
  );
};

// --- MOCK DATA ---
const MOCK_USERS = [
  { id: 'p1', name: "Sarah", role: "Parent", initials: "S", color: "from-pink-500 to-rose-500" },
  { id: 'p2', name: "Dad", role: "Parent", initials: "D", color: "from-blue-500 to-cyan-500" },
  { id: 'c1', name: "Tommy", role: "Child", initials: "T", color: "from-emerald-400 to-teal-500" },
  { id: 'c2', name: "Lily", role: "Child", initials: "L", color: "from-purple-500 to-indigo-500" }
];
const mockTasks = [
  { id: 1, title: "Empty Dishwasher", assignee: "Tommy", points: 10, status: 'open' },
  { id: 2, title: "Walk the Dog", assignee: "Sarah", points: 20, status: 'approved' },
  { id: 3, title: "Finish Math Homework", assignee: "Lily", points: 15, status: 'pending' },
];
const mockEvents = [
  { id: 1, title: "Tommy's Soccer Practice", time: "4:00 PM - 5:30 PM", location: "City Park", color: "bg-emerald-500" },
  { id: 2, title: "Family Dinner", time: "6:30 PM", location: "Home", color: "bg-indigo-500" },
  { id: 3, title: "Dentist Appointment", time: "Tomorrow, 9:00 AM", location: "Dr. Smith's Clinic", color: "bg-rose-500" },
];
const mockMeals = [
  { id: 1, day: "Today", meal: "Spaghetti Bolognese", prepTime: "30m", tags: ["Pasta"], ingredients: "1 lb Ground Beef\n1 box Spaghetti\n1 jar Marinara Sauce", instructions: "1. Boil water and cook pasta.\n2. Brown ground beef.\n3. Simmer sauce." },
];
const mockRewards = [
  { id: 1, title: "30 Min Screen Time", cost: 20, icon: <Smartphone className="w-6 h-6"/>, color: "bg-blue-100 text-blue-600" },
  { id: 2, title: "Choose Movie Night", cost: 50, icon: <Film className="w-6 h-6"/>, color: "bg-purple-100 text-purple-600" },
  { id: 3, title: "Special Activity", cost: 100, icon: <Ticket className="w-6 h-6"/>, color: "bg-pink-100 text-pink-600" },
];
const mockChats = [
  { id: 1, senderId: 'p1', text: "Hey family, what's everyone doing?", time: "3:30 PM" },
  { id: 2, senderId: 'c1', text: "Just finished my homework! Can I have a snack?", time: "3:32 PM" },
  { id: 3, senderId: 'p2', text: "Great job Tommy. Yes, grab an apple.", time: "3:35 PM" },
];

// --- MAIN APP COMPONENT ---
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [activeUser, setActiveUser] = useState(null);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  
  // Onboarding States
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isParent = activeUser?.role === 'Parent';
  const isChild = activeUser?.role === 'Child';

  const [tasks, setTasks] = useState(mockTasks);
  const [events, setEvents] = useState(mockEvents);
  const [meals, setMeals] = useState(mockMeals);
  const [messages, setMessages] = useState(mockChats);
  const [groceries, setGroceries] = useState([]);
  const [userPoints, setUserPoints] = useState({ 'Tommy': 45, 'Lily': 30 });
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Auto-hide Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (user) => {
    setActiveUser(user);
    setActiveTab('home'); // Reset tab on login
    if (user.role === 'Parent' && !hasOnboarded) {
      setShowOnboarding(true);
    }
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setHasOnboarded(true);
    triggerConfetti();
  };

  const handleCompleteTask = (taskId) => {
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === taskId) {
        const assignee = t.assignee;
        if (t.status === 'open') {
          if (isParent) {
            if (assignee && userPoints[assignee] !== undefined) setUserPoints(p => ({...p, [assignee]: p[assignee] + t.points}));
            triggerConfetti();
            return { ...t, status: 'approved' };
          } else {
            triggerConfetti(); 
            return { ...t, status: 'pending' };
          }
        } else if (t.status === 'pending') {
          if (isParent) {
            if (assignee && userPoints[assignee] !== undefined) setUserPoints(p => ({...p, [assignee]: p[assignee] + t.points}));
            triggerConfetti();
            return { ...t, status: 'approved' };
          } else {
            return { ...t, status: 'open' };
          }
        } else if (t.status === 'approved') {
          if (isParent) {
            if (assignee && userPoints[assignee] !== undefined) setUserPoints(p => ({...p, [assignee]: Math.max(0, p[assignee] - t.points)}));
            return { ...t, status: 'open' };
          }
          return t;
        }
      }
      return t;
    }));
  };

  const handleRedeemReward = (cost) => {
    const pointsAvailable = userPoints[activeUser.name] || 0;
    if (!isParent && pointsAvailable >= cost) {
      setUserPoints(p => ({...p, [activeUser.name]: p[activeUser.name] - cost}));
      triggerConfetti();
    } else if (isParent) {
      triggerConfetti(); 
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
  };

  const handleSendMessage = (msg) => setMessages([...messages, msg]);
  const handleAddTask = (newTask) => setTasks([...tasks, { ...newTask, id: Date.now(), status: 'open' }]);
  const handleAddEvent = (newEvent) => setEvents([...events, { ...newEvent, id: Date.now(), color: 'bg-indigo-500' }]);
  const handleAddMeal = (newMeal) => setMeals([...meals, { ...newMeal, id: Date.now(), tags: ['New Recipe'] }]);

  const renderContent = () => {
    const displayPoints = isParent ? (userPoints['Tommy'] + userPoints['Lily']) : (userPoints[activeUser.name] || 0);

    switch(activeTab) {
      case 'home':
        return <Dashboard tasks={tasks} events={events} points={displayPoints} activeUser={activeUser} isParent={isParent} onNavigate={setActiveTab} />;
      case 'tasks':
        return <TasksView tasks={tasks} onComplete={handleCompleteTask} onAdd={handleAddTask} activeUser={activeUser} isParent={isParent} />;
      case 'calendar':
        return <CalendarView events={events} onAdd={handleAddEvent} isParent={isParent} />;
      case 'meals':
        return <MealsView meals={meals} onAdd={handleAddMeal} onUpdate={(m) => setMeals(meals.map(x => x.id === m.id ? m : x))} isParent={isParent} groceries={groceries} setGroceries={setGroceries} />;
      case 'rewards':
        return <RewardsView rewards={mockRewards} points={displayPoints} onRedeem={handleRedeemReward} isParent={isParent} />;
      case 'chat':
        return <ChatView messages={messages} onSend={handleSendMessage} />;
      case 'settings':
        return <SettingsView user={activeUser} isParent={isParent} onLogout={() => setActiveUser(null)} />;
      default:
        return null;
    }
  };

  const pendingApprovalTasks = tasks.filter(t => t.status === 'pending');

  if (showSplash) return <SplashScreen />;
  if (!activeUser) return <LoginScreen onLogin={handleLogin} users={MOCK_USERS} />;
  if (showOnboarding) return <OnboardingFlow onComplete={completeOnboarding} />;

  // Define dynamic nav items based on role
  const navItems = isParent 
    ? [
        { id: 'home', icon: Home, label: 'Today' },
        { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'calendar', icon: CalendarIcon, label: 'Plan' },
        { id: 'meals', icon: ChefHat, label: 'Meals' },
        { id: 'chat', icon: MessageCircle, label: 'Chat' },
        { id: 'rewards', icon: Gift, label: 'Rewards' }
      ]
    : [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'tasks', icon: CheckSquare, label: 'Chores' },
        { id: 'chat', icon: MessageCircle, label: 'Chat' },
        { id: 'rewards', icon: Gift, label: 'Rewards' }
      ];

  // Dynamic Background based on role
  const appBgClass = isChild 
    ? 'bg-gradient-to-br from-sky-100 via-blue-50 to-amber-50 text-slate-800' 
    : 'bg-slate-50 text-slate-800';

  return (
    <ThemeContext.Provider value={{ isChild, user: activeUser }}>
      <div className={`min-h-screen font-sans flex flex-col relative overflow-hidden transition-colors duration-500 ${appBgClass}`}>
        <CustomStyles />
        <Confetti active={showConfetti} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto pb-32 pt-6 px-4 sm:px-6 relative">
          
          {/* Global Header */}
          <header className="flex justify-between items-start mb-6 min-h-[64px] shrink-0">
            <div className="flex-1">
              {activeTab === 'home' && (
                <div className="animate-pop-in">
                  <p className={`text-[12px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5 ${isChild ? 'text-sky-600' : 'text-slate-500'}`}>
                    <CalendarIcon className="w-3.5 h-3.5"/> Today
                  </p>
                  <h1 className={`font-bold tracking-tight leading-tight ${isChild ? 'text-4xl text-slate-800' : 'text-3xl text-slate-900'}`}>
                    {isChild ? `Hi, ${activeUser.name}!` : `Good afternoon,\n${activeUser.name}`}
                  </h1>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 z-20 shrink-0 ml-4 pt-1">
              <div className="relative cursor-pointer group" onClick={() => setIsUserSwitcherOpen(true)}>
                <Avatar user={activeUser} size={isChild ? 'lg' : 'md'} className="group-hover:scale-105 transition-transform duration-300 shadow-sm ring-4 ring-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 border-[2px] border-white rounded-full shadow-sm flex items-center justify-center text-[9px] text-white font-bold z-10">
                  {isParent ? 'P' : 'C'}
                </span>
                {isParent && pendingApprovalTasks.length > 0 && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-slate-50 rounded-full shadow-sm animate-pulse z-20 -translate-y-1/3 translate-x-1/3"></span>
                )}
              </div>
              {isParent && (
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-11 h-11 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-sm ring-1 ring-slate-900/5 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all ${activeTab === 'settings' ? 'text-indigo-600 bg-indigo-50 ring-indigo-200' : 'text-slate-500'}`}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              )}
            </div>
          </header>

          {renderContent()}
        </main>

        {/* Sleek Minimalist AI Copilot FAB (Parents Only) */}
        {isParent && (
          <button 
            onClick={() => setIsCopilotOpen(true)}
            className="fixed bottom-24 right-4 sm:right-8 z-40 bg-white/95 backdrop-blur-xl text-indigo-600 p-3.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/5 hover:scale-105 active:scale-95 transition-all group flex items-center justify-center"
          >
            <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
        )}

        <AICopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />

        {/* User Switcher Modal */}
        <Modal isOpen={isUserSwitcherOpen} onClose={() => setIsUserSwitcherOpen(false)} title="Switch Profile">
          <div className="space-y-3">
            {MOCK_USERS.map(user => (
              <div 
                key={user.id} 
                onClick={() => { setActiveUser(user); setIsUserSwitcherOpen(false); }}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${activeUser.id === user.id ? 'bg-slate-100 ring-2 ring-slate-400' : 'bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-900/5'}`}
              >
                <Avatar user={user} size="md" />
                <div>
                  <h4 className="font-bold text-slate-800">{user.name}</h4>
                  <p className="text-xs font-medium text-slate-500">{user.role}</p>
                </div>
                {activeUser.id === user.id && <Check className="w-5 h-5 text-slate-800 ml-auto" />}
              </div>
            ))}
          </div>
        </Modal>

        {/* Dynamic Dock Navigation */}
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-black/5 via-black/5 to-transparent z-40 pointer-events-none flex justify-center">
          <nav className={`${isChild ? 'bg-white rounded-[2rem] px-2 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border-4 border-white/50' : 'bg-white/90 backdrop-blur-2xl px-2 py-2 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-full ring-1 ring-slate-900/5'} flex justify-between items-center overflow-x-auto no-scrollbar w-full max-w-md pointer-events-auto transition-all duration-500`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              // Dynamic active colors based on role
              const activeColor = isChild ? 'text-sky-500' : 'text-indigo-600';
              const activeBg = isChild ? 'bg-sky-50' : 'bg-indigo-50/80';
              
              return (
                <button 
                  key={item.id} 
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 min-w-[50px] ${isChild ? 'py-2' : 'py-2'} ${isActive ? `${activeColor} scale-105` : 'text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95'}`}
                >
                  {isActive && (
                    <div className={`absolute inset-0 ${activeBg} ${isChild ? 'rounded-2xl' : 'rounded-full'} -z-10`}></div>
                  )}
                  <Icon className={`${isChild ? 'w-6 h-6' : 'w-5 h-5'} transition-all duration-300 ${isActive ? 'fill-current opacity-20' : ''}`} />
                  <span className={`tracking-wide transition-all mt-0.5 ${isChild ? 'text-[10px] font-bold' : 'text-[9px] font-bold'}`}>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

// --- SUB-VIEWS ---

const ChatView = ({ messages, onSend }) => {
  const { isChild, user } = useContext(ThemeContext);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    onSend({ id: Date.now(), senderId: user.id, text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] animate-pop-in">
      <div className="flex justify-between items-end mb-4 shrink-0">
        <h2 className="text-2xl font-bold text-slate-900">Family Chat</h2>
      </div>

      <Card className="flex-1 flex flex-col !p-0 overflow-hidden relative">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === user.id;
            const sender = MOCK_USERS.find(u => u.id === msg.senderId);
            
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && <Avatar user={sender} size="sm" className="shrink-0 mt-1" />}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  {!isMe && <span className="text-[10px] font-bold text-slate-400 ml-1 mb-0.5">{sender?.name}</span>}
                  
                  <div className={`p-3 text-sm font-medium leading-relaxed shadow-sm
                    ${isMe 
                      ? (isChild ? 'bg-sky-500 text-white rounded-2xl rounded-br-sm' : 'bg-slate-800 text-white rounded-2xl rounded-br-sm') 
                      : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm ring-1 ring-slate-900/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 mt-1">{msg.time}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 shrink-0">
          
          {/* Child Quick Replies */}
          {isChild && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
              {['👍', '❤️', 'Done!', 'Need help', 'Snack time?'].map(reply => (
                <button 
                  key={reply}
                  onClick={() => handleSend(reply)}
                  className="whitespace-nowrap bg-white border-2 border-slate-200 text-slate-700 px-4 py-1.5 rounded-xl text-sm font-bold hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {!isChild && (
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
            )}
            
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder={isChild ? "Type a message..." : "Message family..."}
              className={`flex-1 bg-white border text-slate-800 focus:outline-none transition-all font-medium ${isChild ? 'border-slate-200 rounded-xl px-4 py-3 shadow-sm' : 'border-slate-200 rounded-full pl-4 pr-4 py-2.5 focus:ring-1 focus:ring-slate-300'}`}
            />
            
            <button 
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className={`p-3 text-white transition-all shadow-sm disabled:opacity-50 flex items-center justify-center ${isChild ? 'bg-sky-500 rounded-xl hover:bg-sky-400 active:scale-95' : 'bg-slate-800 rounded-full hover:bg-slate-700'}`}
            >
              <Send className={`${isChild ? 'w-5 h-5' : 'w-4 h-4'}`} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ... (Rest of existing sub-components unchanged, dynamically utilizing ThemeContext via primitives) ...

const SplashScreen = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden transition-opacity duration-500">
    <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px]"></div>
    <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px]"></div>
    <div className="flex flex-col items-center animate-pulse-slow z-10">
      <Layers className="w-16 h-16 text-white mb-6 drop-shadow-2xl" strokeWidth={1.5} />
      <h1 className="text-3xl font-semibold tracking-wide drop-shadow-lg">FamilyOS</h1>
    </div>
  </div>
);

const OnboardingFlow = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const content = [
    { icon: <Users className="w-10 h-10 text-indigo-500" strokeWidth={1.5} />, title: "Welcome to FamilyOS", desc: "The smart operating system designed to keep your modern family organized, together." },
    { icon: <Wand2 className="w-10 h-10 text-purple-500" strokeWidth={1.5} />, title: "Meet Your Copilot", desc: "Instantly generate meal plans, auto-create grocery lists, and resolve scheduling conflicts using AI." },
    { icon: <Gift className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />, title: "Gamify the Household", desc: "Kids earn points by completing assigned chores and can redeem them for real-life rewards." }
  ];
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pop-in max-w-md mx-auto w-full">
        <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8 ring-1 ring-slate-900/5 transition-all">
          {content[step].icon}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">{content[step].title}</h2>
        <p className="text-slate-500 text-base leading-relaxed font-medium">{content[step].desc}</p>
      </div>
      <div className="bg-white px-6 pb-12 pt-8 rounded-t-[2.5rem] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.03)] flex flex-col items-center max-w-md mx-auto w-full">
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map(idx => (<div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${step === idx ? 'w-6 bg-slate-800' : 'w-1.5 bg-slate-200'}`} />))}
        </div>
        <Button onClick={() => { if (step < 2) setStep(step + 1); else onComplete(); }} className="w-full text-base">{step < 2 ? 'Continue' : 'Get Started'}</Button>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin, users }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]"></div>
    <div className="mb-16 text-center animate-pop-in relative z-10 flex flex-col items-center">
      <Layers className="w-12 h-12 text-white/90 mb-6 drop-shadow-lg" strokeWidth={1.5} />
      <h1 className="text-3xl font-semibold tracking-wide mb-2 text-white/90">FamilyOS</h1>
      <p className="text-white/50 text-sm font-medium tracking-wide">Select your profile</p>
    </div>
    <div className="grid grid-cols-2 gap-x-10 gap-y-12 w-full max-w-sm animate-pop-in relative z-10" style={{animationDelay: '0.1s'}}>
      {users.map(u => (
        <div key={u.id} onClick={() => onLogin(u)} className="flex flex-col items-center gap-4 cursor-pointer group">
          <Avatar user={u} size="xxl" className="group-hover:scale-105 transition-transform duration-300 shadow-2xl border-white/20" />
          <span className="font-medium text-base tracking-wide text-white/70 group-hover:text-white transition-colors">{u.name}</span>
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = ({ tasks, events, points, activeUser, isParent, onNavigate }) => {
  const { isChild } = useContext(ThemeContext);
  const visibleTasks = isParent ? tasks : tasks.filter(t => t.assignee === activeUser.name || t.assignee === 'Anyone');
  const openTasks = visibleTasks.filter(t => t.status === 'open').length;
  const pendingApproval = tasks.filter(t => t.status === 'pending').length;
  
  return (
    <div className="space-y-6 animate-pop-in">
      {isParent && pendingApproval > 0 && (
        <Card onClick={() => onNavigate('tasks')} className="!bg-amber-500 text-white !border-0 flex items-center justify-between group shadow-lg shadow-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Bell className="w-5 h-5 text-white" /></div>
            <div>
              <h4 className="font-bold text-base leading-tight">Approvals Needed</h4>
              <p className="text-sm text-white/90 font-medium">{pendingApproval} task{pendingApproval > 1 ? 's' : ''} waiting for your review</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card onClick={() => onNavigate('tasks')} className={`flex flex-col items-start gap-2 border-0 shadow-lg ${isChild ? '!bg-sky-500 text-white !ring-0 shadow-sky-500/30' : 'bg-slate-900 text-white shadow-slate-900/10'}`}>
          <CheckSquare className="w-6 h-6 opacity-80" strokeWidth={2} />
          <div>
            <p className="text-3xl font-bold tracking-tight">{openTasks}</p>
            <p className="text-xs font-medium text-white/70">Chores Left</p>
          </div>
        </Card>
        <Card onClick={() => onNavigate('rewards')} className="flex flex-col items-start gap-2">
          <div className={`p-1.5 rounded-lg ${isChild ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-slate-800">{points}</p>
            <p className="text-xs font-medium text-slate-500">{isParent ? 'Total Family Pts' : 'My Points'}</p>
          </div>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Up Next</h3>
          <button onClick={() => isParent ? onNavigate('calendar') : null} className="text-sm font-semibold text-slate-500 flex items-center hover:text-slate-800 transition-colors">
            {isParent && <>View Schedule <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
        <Card className="!p-0 overflow-hidden">
          {events.slice(0, 2).map((event, i) => (
            <div key={event.id} className={`p-4 flex gap-4 items-center ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
              <div className={`w-1.5 h-10 rounded-full ${event.color}`}></div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{event.title}</p>
                <div className="flex gap-3 mt-1 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {event.time}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

const TasksView = ({ tasks, onComplete, onAdd, activeUser, isParent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('Tommy');
  const [taskPoints, setTaskPoints] = useState(10);
  const { isChild } = useContext(ThemeContext);

  const visibleTasks = isParent ? tasks : tasks.filter(t => t.assignee === activeUser.name || t.assignee === 'Anyone');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, assignee, points: parseInt(taskPoints) });
    setTitle('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{isParent ? 'Family Tasks' : 'My Chores'}</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Check off to earn points!</p>
        </div>
        {isParent && <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="!w-auto !py-2 !px-4 text-sm"><Plus className="w-4 h-4"/> New</Button>}
      </div>

      <div className="space-y-3">
        {visibleTasks.length === 0 && (
            <div className="text-center py-10 text-slate-400 font-medium">No tasks assigned right now!</div>
        )}
        {visibleTasks.map((task) => {
          const isApproved = task.status === 'approved';
          const isPending = task.status === 'pending';

          return (
            <Card 
              key={task.id} 
              onClick={() => onComplete(task.id)} 
              className={`!p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between group cursor-pointer 
                ${isApproved ? 'opacity-60 bg-slate-50/50' : isPending ? 'ring-2 ring-amber-400/50 bg-amber-50/50' : ''}`
              }
            >
              <div className="flex items-center gap-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 
                  ${isApproved ? 'bg-emerald-500 border-emerald-500' : isPending ? 'bg-amber-400 border-amber-400' : 'border-slate-300 group-hover:border-slate-400'}`
                }>
                  {isApproved && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  {isPending && <Hourglass className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className={`font-bold text-sm transition-all ${isApproved ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3"/> {task.assignee}
                    </p>
                    {isPending && isChild && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Awaiting Parent</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end sm:justify-start">
                {isPending && isParent && (
                    <Badge variant="warning" className="!bg-amber-500 !text-white !border-amber-600 animate-pulse !py-1.5 px-3">Tap to Approve</Badge>
                )}
                <Badge variant={isApproved ? 'default' : isPending ? 'warning' : 'premium'}>+{task.points} pt</Badge>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Task">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Task Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g., Clean the garage" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Assignee</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                <option>Tommy</option>
                <option>Lily</option>
                <option>Sarah</option>
                <option>Dad</option>
                <option>Anyone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Points</label>
              <select value={taskPoints} onChange={e => setTaskPoints(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                <option value="5">5 pts</option>
                <option value="10">10 pts</option>
                <option value="15">15 pts</option>
                <option value="20">20 pts</option>
                <option value="50">50 pts</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="mt-4">Add Task</Button>
        </form>
      </Modal>
    </div>
  );
};

const CalendarView = ({ events, onAdd, isParent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, time: time || 'TBD', location: location || 'Home' });
    setTitle('');
    setTime('');
    setLocation('');
    setIsModalOpen(false);
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [12, 13, 14, 15, 16, 17, 18];
  
  return (
    <div className="space-y-6 animate-pop-in">
      <div className="flex justify-between items-end">
        <h2 className="text-2xl font-bold text-slate-900">This Week</h2>
        {isParent && <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="!w-auto !py-2 !px-4 text-sm"><Plus className="w-4 h-4"/> Event</Button>}
      </div>

      <div className="flex justify-between items-center bg-white/60 p-2 rounded-[1.5rem] ring-1 ring-slate-900/5">
        {days.map((day, idx) => {
          const isToday = idx === 2; 
          return (
            <div key={day} className={`flex flex-col items-center justify-center w-12 h-16 rounded-2xl transition-all ${isToday ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">{day}</span>
              <span className={`text-lg font-bold mt-0.5 ${isToday ? 'text-white' : 'text-slate-800'}`}>{dates[idx]}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {events.map((event, idx) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-slate-50 bg-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${event.color.replace('bg-', 'text-')}`}>
              <Clock className="w-4 h-4 currentColor" />
            </div>
            <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] !p-4 !rounded-[1.5rem]">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="!bg-slate-50">{event.time}</Badge>
              </div>
              <p className="font-semibold text-slate-800 text-base">{event.title}</p>
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-2">
                <MapPin className="w-3.5 h-3.5"/> {event.location}
              </p>
            </Card>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Event">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Event Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g., Dentist Appointment" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Time</label>
              <input type="text" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g., 2:00 PM" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g., Clinic" />
            </div>
          </div>
          <Button type="submit" className="mt-4">Add Event</Button>
        </form>
      </Modal>
    </div>
  );
};

const AICopilotModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hi! I'm your FamilyOS Copilot. I can help organize chores, plan meals, or resolve scheduling conflicts. What's up?" }]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);

  const handleSend = (presetText = null) => {
    const textToSend = presetText || input;
    if (!textToSend.trim()) return;
    setMessages([...messages, { role: 'user', text: textToSend }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: "I've drafted a plan based on your request. Should I add it to the calendar?" }]);
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<div className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-indigo-500"/> Copilot</div>} fullHeight>
      <div className="flex flex-col h-full h-[60vh]">
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm ring-1 ring-slate-900/5'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {messages.length < 3 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 pt-2 shrink-0">
            {["Plan Dinners", "Assign Chores", "Find Free Time"].map(action => (
              <button key={action} onClick={() => handleSend(action)} className="whitespace-nowrap bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm">{action}</button>
            ))}
          </div>
        )}
        <div className="relative mt-auto shrink-0 pt-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask Copilot anything..." className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-full pl-5 pr-12 py-4 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all font-medium" />
          <button onClick={() => handleSend()} disabled={!input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </Modal>
  );
};

const MealsView = ({ meals, onAdd, onUpdate, isParent, groceries, setGroceries }) => {
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
    <div className="space-y-6 animate-pop-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Meal Plan</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">What's cooking this week?</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openGroceryList} variant="secondary" className="!w-auto !py-2 !px-3 text-sm"><ShoppingCart className="w-4 h-4"/> <span className="hidden sm:inline">List</span></Button>
          {isParent && <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="!w-auto !py-2 !px-3 text-sm"><Plus className="w-4 h-4"/> <span className="hidden sm:inline">Recipe</span></Button>}
        </div>
      </div>

      <div className="space-y-4">
        {meals.map((meal) => (
          <Card key={meal.id} onClick={() => setSelectedMeal(meal)} className="!p-4 flex flex-col gap-3 group cursor-pointer">
            <div className="flex justify-between items-start">
              <Badge variant={meal.day === 'Today' ? 'premium' : 'default'} className="!text-[10px]">{meal.day}</Badge>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {meal.prepTime}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1rem] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Utensils className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-800 leading-tight">{meal.meal}</h4>
                <div className="flex gap-2 mt-2">
                  {meal.tags.map(tag => <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wider">{tag}</span>)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Recipe">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">Recipe Name</label><input type="text" value={meal} onChange={e => setMeal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g., Chicken Parmesan" autoFocus /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Day</label><select value={day} onChange={e => setDay(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"><option>Today</option><option>Tomorrow</option></select></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Prep Time</label><select value={prepTime} onChange={e => setPrepTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"><option value="15m">15 mins</option><option value="30m">30 mins</option></select></div>
          </div>
          <Button type="submit" className="mt-4">Save Recipe</Button>
        </form>
      </Modal>

      <Modal isOpen={!!selectedMeal} onClose={closeMealModal} title={isEditing ? "Edit Recipe" : (selectedMeal?.meal || "Recipe")}>
        {selectedMeal && !isEditing && (
          <div className="space-y-6">
            <div className="flex gap-2"><Badge variant="premium">{selectedMeal.day}</Badge><Badge variant="default">{selectedMeal.prepTime}</Badge></div>
            <div className="bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-900/5"><h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Utensils className="w-4 h-4"/> Ingredients</h4><ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">{(selectedMeal.ingredients || "").split('\n').map((item, i) => <li key={i}>{item}</li>)}</ul></div>
            <div className="bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-900/5"><h4 className="font-bold text-slate-800 mb-2">Instructions</h4><ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2">{(selectedMeal.instructions || "").split('\n').map((item, i) => <li key={i}>{item}</li>)}</ol></div>
            <div className="flex gap-3"><Button onClick={closeMealModal} variant="secondary" className="flex-1">Close</Button>{isParent && <Button onClick={handleEditClick} className="flex-1">Edit Plan</Button>}</div>
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

const RewardsView = ({ rewards, points, onRedeem, isParent }) => {
  const { isChild } = useContext(ThemeContext);
  return (
    <div className="space-y-6 animate-pop-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Rewards</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Cash in your hard work!</p>
        </div>
        <div className={`${isChild ? 'bg-amber-400 text-amber-900 border-2 border-amber-500 shadow-[0_4px_0_rgb(217,119,6)]' : 'bg-slate-900 text-white'} px-4 py-2 rounded-2xl flex items-center gap-2 transition-all`}>
          <Star className={`w-4 h-4 ${isChild ? 'fill-amber-700' : 'fill-white/50'}`} />
          <span className="font-bold text-lg">{points} {isParent ? 'Total pts' : 'pts'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rewards.map((reward) => (
          <Card key={reward.id} className="!p-5 flex flex-col justify-between gap-4 group">
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-sm ${reward.color} group-hover:scale-110 transition-transform duration-300`}>
                {reward.icon}
              </div>
              <Badge variant="warning" className="!bg-amber-100 !text-amber-700 !border-0 shadow-sm flex items-center gap-1">
                <Flame className="w-3 h-3"/> {reward.cost} pts
              </Badge>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-800 text-base">{reward.title}</h4>
            </div>

            <Button 
              variant={points >= reward.cost ? (isChild ? 'premium' : 'primary') : (isChild ? 'outline' : 'secondary')} 
              className="!py-2.5 mt-2 text-sm"
              disabled={points < reward.cost || isParent}
              onClick={() => onRedeem(reward.cost)}
            >
              {isParent ? 'Kids Redeem Here' : (points >= reward.cost ? 'Redeem Reward' : `Need ${reward.cost - points} more`)}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SettingsView = ({ user, isParent, onLogout }) => {
  const [activeModal, setActiveModal] = useState(null);
  const handleModalClose = () => setActiveModal(null);

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage family preferences</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="!p-0 overflow-hidden">
          <div className="p-5 flex items-center gap-4 border-b border-slate-100">
            <Avatar user={user} size="lg" className="ring-4 ring-white shadow-sm" />
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">{user.name}</h3>
              <p className="text-sm font-medium text-slate-500">{user.role}</p>
            </div>
            <Button onClick={() => setActiveModal('editProfile')} variant="secondary" className="!w-auto !py-2 !px-4 text-xs ml-auto">Edit</Button>
          </div>
          <div className="p-2">
            {isParent && <SettingRow onClick={() => setActiveModal('family')} icon={Users} label="Family Members" value="4 Members" />}
            <SettingRow onClick={() => setActiveModal('notifications')} icon={BellRing} label="Notifications" value="Enabled" />
            {isParent && <SettingRow onClick={() => setActiveModal('subscription')} icon={CreditCard} label="Subscription" value="Premium" />}
          </div>
        </Card>

        {isParent && (
          <>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-2 mt-6 mb-2">App Settings</h3>
            <Card className="!p-2">
              <SettingRow onClick={() => setActiveModal('general')} icon={Settings} label="General Preferences" />
              <SettingRow onClick={() => setActiveModal('logout')} icon={LogOut} label="Log Out" className="text-rose-600" iconClass="text-rose-500 bg-rose-50" hideArrow />
            </Card>
          </>
        )}
        
        {!isParent && (
            <Card className="!p-2 mt-6">
                <SettingRow onClick={() => setActiveModal('logout')} icon={LogOut} label="Log Out" className="text-rose-600" iconClass="text-rose-500 bg-rose-50" hideArrow />
            </Card>
        )}
      </div>

      {/* Settings Modals */}
      <Modal isOpen={activeModal === 'editProfile'} onClose={handleModalClose} title="Edit Profile">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
            <input type="text" defaultValue={user.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-slate-300" />
          </div>
          <Button onClick={handleModalClose} className="mt-2">Save Changes</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'family'} onClose={handleModalClose} title="Family Members">
        <div className="space-y-3">
          {MOCK_USERS.map((member, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-[1.25rem] border border-slate-100">
              <div className="flex items-center gap-3">
                <Avatar user={member} size="sm" />
                <span className="font-semibold text-slate-700 text-sm">{member.name} <span className="text-slate-400 font-normal">({member.role})</span></span>
              </div>
              <Button variant="secondary" className="!w-auto !py-1.5 !px-3 text-xs">Edit</Button>
            </div>
          ))}
          <Button variant="outline" className="mt-2 w-full border-dashed"><Plus className="w-4 h-4"/> Add Member</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'notifications'} onClose={handleModalClose} title="Notifications">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700">Push Notifications</span>
            <div className="w-12 h-6 bg-slate-800 rounded-full relative cursor-pointer"><div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div></div>
          </div>
        </div>
        <Button onClick={handleModalClose} className="mt-4">Done</Button>
      </Modal>

      <Modal isOpen={activeModal === 'logout'} onClose={handleModalClose} title="Log Out">
        <div className="space-y-4">
          <p className="text-slate-600 font-medium">Are you sure you want to log out of FamilyOS?</p>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={handleModalClose} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => { handleModalClose(); onLogout(); }} className="flex-1 !bg-rose-500 hover:!bg-rose-600 !shadow-none">Log Out</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const SettingRow = ({ icon: Icon, label, value, className = '', iconClass = '', hideArrow = false, onClick }) => (
  <div onClick={onClick} className={`flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors ${className}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl bg-slate-100 text-slate-600 ${iconClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="font-semibold text-sm text-slate-700">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-sm font-medium text-slate-500">{value}</span>}
      {!hideArrow && <ChevronRight className="w-4 h-4 text-slate-400" />}
    </div>
  </div>
);
