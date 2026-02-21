import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Home, CheckSquare, Calendar as CalendarIcon, 
  ChefHat, Gift, X, Plus, Sparkles, Bell, 
  ChevronRight, Clock, MapPin, Send, User, Check,
  Utensils, Star, Flame, MoreVertical, Users, BellRing, CreditCard, LogOut
} from 'lucide-react';

// --- CUSTOM STYLES & KEYFRAMES ---
const CustomStyles = () => (
  <style>
    {`
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      
      @keyframes popIn {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes confetti-fall {
        0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
      }

      .animate-pop-in { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      
      .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
    `}
  </style>
);

// --- REUSABLE UI PRIMITIVES ---
const Card = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 p-5 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 active:scale-[0.98]' : ''} ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "w-full font-bold rounded-2xl py-3.5 px-4 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-50 disabled:pointer-events-none";
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

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-slate-100/80 text-slate-700 ring-1 ring-slate-900/5",
    success: "bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-900/5",
    warning: "bg-amber-100/80 text-amber-700 ring-1 ring-amber-900/5",
    premium: "bg-violet-100/80 text-violet-700 ring-1 ring-violet-900/5",
  };
  return (
    <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children, fullHeight = false }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/30 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className={`bg-white/95 backdrop-blur-2xl w-full sm:w-[90%] max-w-md ${fullHeight ? 'h-[90%]' : 'max-h-[90%]'} sm:h-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl flex flex-col ring-1 ring-slate-900/5 relative animate-pop-in cursor-default`}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden opacity-60"></div>
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 bg-slate-100/80 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all hover:rotate-90 duration-300">
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
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400'];
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
const mockUser = { name: "Sarah", role: "Parent", avatar: "👩‍🦰" };
const mockTasks = [
  { id: 1, title: "Empty Dishwasher", assignee: "Tommy", points: 10, completed: false },
  { id: 2, title: "Walk the Dog", assignee: "Sarah", points: 20, completed: true },
  { id: 3, title: "Finish Math Homework", assignee: "Lily", points: 15, completed: false },
];
const mockEvents = [
  { id: 1, title: "Tommy's Soccer Practice", time: "4:00 PM - 5:30 PM", location: "City Park", color: "bg-emerald-500" },
  { id: 2, title: "Family Dinner", time: "6:30 PM", location: "Home", color: "bg-indigo-500" },
  { id: 3, title: "Dentist Appointment", time: "Tomorrow, 9:00 AM", location: "Dr. Smith's Clinic", color: "bg-rose-500" },
];
const mockMeals = [
  { id: 1, day: "Today", meal: "Spaghetti Bolognese", prepTime: "30m prep", tags: ["Pasta", "Kid-Friendly"], ingredients: "1 lb Ground Beef\n1 box Spaghetti\n1 jar Marinara Sauce", instructions: "1. Boil water and cook pasta.\n2. Brown ground beef in a skillet.\n3. Add marinara sauce and simmer.\n4. Serve sauce over pasta." },
  { id: 2, day: "Tomorrow", meal: "Taco Tuesday", prepTime: "20m prep", tags: ["Mexican", "Quick"], ingredients: "1 lb Ground Turkey\n1 packet Taco Seasoning\n8 Taco Shells\nCheese, Lettuce, Salsa", instructions: "1. Brown turkey in a pan.\n2. Add seasoning and water, simmer.\n3. Warm taco shells.\n4. Assemble tacos with toppings." },
  { id: 3, day: "Wednesday", meal: "Grilled Chicken & Veggies", prepTime: "45m prep", tags: ["Healthy"], ingredients: "2 Chicken Breasts\n1 bunch Asparagus\n2 tbsp Olive Oil\nSalt, Pepper, Garlic Powder", instructions: "1. Preheat grill or pan.\n2. Season chicken and vegetables.\n3. Grill chicken until cooked through.\n4. Roast or grill asparagus until tender." },
];
const mockRewards = [
  { id: 1, title: "30 Min Extra Screen Time", cost: 20, icon: "📱", color: "bg-blue-100 text-blue-600" },
  { id: 2, title: "Choose Movie Night Film", cost: 50, icon: "🍿", color: "bg-purple-100 text-purple-600" },
  { id: 3, title: "Ice Cream Trip", cost: 100, icon: "🍦", color: "bg-pink-100 text-pink-600" },
];

// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tasks, setTasks] = useState(mockTasks);
  const [events, setEvents] = useState(mockEvents);
  const [meals, setMeals] = useState(mockMeals);
  const [points, setPoints] = useState(45); // Live state for family points
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Wire checking off tasks to point additions
  const handleCompleteTask = (taskId) => {
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === taskId) {
        const newCompleted = !t.completed;
        if (newCompleted) {
          setPoints(p => p + t.points);
          triggerConfetti();
        } else {
          setPoints(p => Math.max(0, p - t.points));
        }
        return { ...t, completed: newCompleted };
      }
      return t;
    }));
  };

  // Wire reward redemption to point deductions
  const handleRedeemReward = (cost) => {
    if (points >= cost) {
      setPoints(p => p - cost);
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
  };

  const handleAddTask = (newTask) => setTasks([...tasks, { ...newTask, id: Date.now(), completed: false }]);
  const handleAddEvent = (newEvent) => setEvents([...events, { ...newEvent, id: Date.now(), color: 'bg-indigo-500' }]);
  const handleAddMeal = (newMeal) => setMeals([...meals, { ...newMeal, id: Date.now(), tags: ['New Recipe'], ingredients: "1 lb Main Protein/Base\n2 cups Fresh Vegetables\n1 tbsp Olive Oil\nAssorted Seasonings", instructions: "1. Preheat oven or heat pan to medium-high.\n2. Chop and prepare all ingredients.\n3. Cook the main base until fully done.\n4. Mix in vegetables and seasonings. Serve hot." }]);
  const handleUpdateMeal = (updatedMeal) => setMeals(meals.map(m => m.id === updatedMeal.id ? updatedMeal : m));

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return <Dashboard tasks={tasks} events={events} points={points} onNavigate={setActiveTab} />;
      case 'tasks':
        return <TasksView tasks={tasks} onComplete={handleCompleteTask} onAdd={handleAddTask} />;
      case 'calendar':
        return <CalendarView events={events} onAdd={handleAddEvent} />;
      case 'meals':
        return <MealsView meals={meals} onAdd={handleAddMeal} onUpdate={handleUpdateMeal} />;
      case 'rewards':
        return <RewardsView rewards={mockRewards} points={points} onRedeem={handleRedeemReward} />;
      case 'settings':
        return <SettingsView user={mockUser} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">Coming soon in Premium Version</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative overflow-hidden">
      <CustomStyles />
      <Confetti active={showConfetti} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto pb-32 pt-8 px-4 sm:px-6 relative">
        {/* Header section (Visible only on Home) */}
        {activeTab === 'home' && (
          <header className="flex justify-between items-start mb-8 animate-pop-in">
            <div>
              <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4"/> Today
              </p>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Good afternoon,<br/>{mockUser.name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative cursor-pointer group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative w-14 h-14 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm border-2 border-white ring-1 ring-slate-100/50">
                  {mockUser.avatar}
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-[2px] border-white rounded-full shadow-sm"></span>
              </div>
              <button 
                onClick={() => setActiveTab('settings')}
                className="p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm ring-1 ring-slate-900/5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </header>
        )}

        {renderContent()}
      </main>

      {/* Floating Action Button for AI Copilot */}
      <button 
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-28 right-4 sm:right-8 z-40 bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgba(139,92,246,0.5)] hover:scale-105 active:scale-95 transition-all group"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>

      {/* AI Copilot Modal */}
      <AICopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />

      {/* Premium Floating iOS-Style Dock */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-40 pointer-events-none flex justify-center">
        <nav className="bg-white/80 backdrop-blur-2xl px-2 py-2 flex justify-between items-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] rounded-[2rem] ring-1 ring-slate-900/5 overflow-x-auto no-scrollbar w-full max-w-md pointer-events-auto">
          {[
            { id: 'home', icon: Home, label: 'Today' },
            { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
            { id: 'calendar', icon: CalendarIcon, label: 'Plan' },
            { id: 'meals', icon: ChefHat, label: 'Meals' },
            { id: 'rewards', icon: Gift, label: 'Rewards' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-300 flex-1 min-w-[50px] py-2 ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600 hover:scale-105 active:scale-95'}`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-indigo-50/80 rounded-[1.5rem] -z-10"></div>
                )}
                <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'fill-indigo-100/50' : ''}`} />
                <span className={`text-[9px] tracking-wide transition-all mt-0.5 ${isActive ? 'font-extrabold' : 'font-semibold'}`}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  );
}

// --- SUB-VIEWS ---

const Dashboard = ({ tasks, events, points, onNavigate }) => {
  const pendingTasks = tasks.filter(t => !t.completed).length;
  
  return (
    <div className="space-y-6 animate-pop-in">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card onClick={() => onNavigate('tasks')} className="flex flex-col items-start gap-2 bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-0 shadow-indigo-500/20">
          <CheckSquare className="w-8 h-8 opacity-80" />
          <div>
            <p className="text-3xl font-extrabold">{pendingTasks}</p>
            <p className="text-sm font-medium opacity-80">Tasks Left</p>
          </div>
        </Card>
        <Card onClick={() => onNavigate('rewards')} className="flex flex-col items-start gap-2">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-800">{points}</p>
            <p className="text-sm font-medium text-slate-500">Family Points</p>
          </div>
        </Card>
      </div>

      {/* Up Next Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Up Next</h3>
          <button onClick={() => onNavigate('calendar')} className="text-sm font-bold text-indigo-600 flex items-center hover:opacity-80 transition-opacity">
            View Schedule <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <Card className="!p-0 overflow-hidden">
          {events.slice(0, 2).map((event, i) => (
            <div key={event.id} className={`p-4 flex gap-4 items-center ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
              <div className={`w-2 h-12 rounded-full ${event.color}`}></div>
              <div>
                <p className="font-bold text-slate-800">{event.title}</p>
                <div className="flex gap-3 mt-1 text-xs font-medium text-slate-500">
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

const TasksView = ({ tasks, onComplete, onAdd }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('Tommy');
  const [taskPoints, setTaskPoints] = useState(10);

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
          <h2 className="text-2xl font-extrabold text-slate-900">Family Tasks</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Check off to earn points!</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="premium" className="!w-auto !py-2 !px-4 text-sm"><Plus className="w-4 h-4"/> New</Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} onClick={() => onComplete(task.id)} className={`!p-4 flex items-center justify-between group ${task.completed ? 'opacity-60 bg-slate-50/50' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${task.completed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                {task.completed && <Check className="w-4 h-4 text-white" />}
              </div>
              <div>
                <p className={`font-bold transition-all ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                  <User className="w-3 h-3"/> {task.assignee}
                </p>
              </div>
            </div>
            <Badge variant={task.completed ? 'default' : 'warning'}>+{task.points} pt</Badge>
          </Card>
        ))}
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

const CalendarView = ({ events, onAdd }) => {
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
        <h2 className="text-2xl font-extrabold text-slate-900">This Week</h2>
        <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="!w-auto !py-2 !px-4 text-sm"><Plus className="w-4 h-4"/> Event</Button>
      </div>

      {/* Horizontal Date Picker */}
      <div className="flex justify-between items-center bg-white/60 p-2 rounded-3xl ring-1 ring-slate-900/5">
        {days.map((day, idx) => {
          const isToday = idx === 2; // Mocking Wednesday as today
          return (
            <div key={day} className={`flex flex-col items-center justify-center w-12 h-16 rounded-2xl transition-all ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-500 hover:bg-white'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">{day}</span>
              <span className={`text-lg font-extrabold mt-0.5 ${isToday ? 'text-white' : 'text-slate-800'}`}>{dates[idx]}</span>
            </div>
          );
        })}
      </div>

      {/* Timeline Events */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {events.map((event, idx) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${event.color.replace('bg-', 'text-')}`}>
              <Clock className="w-4 h-4 currentColor" />
            </div>
            <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] !p-4 !rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="!bg-slate-50">{event.time}</Badge>
              </div>
              <p className="font-bold text-slate-800 text-lg">{event.title}</p>
              <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-2">
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

// --- AI COPILOT COMPONENT ---
const AICopilotModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm your FamilyOS Copilot. I can help organize chores, plan meals, or resolve scheduling conflicts. What's up?" }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (presetText = null) => {
    const textToSend = presetText || input;
    if (!textToSend.trim()) return;

    setMessages([...messages, { role: 'user', text: textToSend }]);
    setInput('');

    // Mock AI Response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "I've drafted a plan based on your request. I've scheduled 'Clean Garage' for Saturday morning and assigned it to Tommy and Dad. Should I add it to the calendar?" 
      }]);
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✨ AI Copilot" fullHeight>
      <div className="flex flex-col h-full h-[60vh]">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-slate-100 text-slate-800 rounded-bl-sm ring-1 ring-slate-900/5'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions (Only show if few messages) */}
        {messages.length < 3 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 pt-2 shrink-0">
            {["Plan Dinners", "Assign Weekend Chores", "Find Free Time"].map(action => (
              <button 
                key={action}
                onClick={() => handleSend(action)}
                className="whitespace-nowrap bg-white border border-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="relative mt-auto shrink-0 pt-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Copilot anything..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-full pl-5 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all font-medium"
          />
          <button 
            onClick={() => handleSend()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50"
            disabled={!input.trim()}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

const MealsView = ({ meals, onAdd, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  
  const [meal, setMeal] = useState('');
  const [day, setDay] = useState('Today');
  const [prepTime, setPrepTime] = useState('30m');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!meal.trim()) return;
    onAdd({ meal, day, prepTime: prepTime + ' prep' });
    setMeal('');
    setIsModalOpen(false);
  };

  const handleEditClick = () => {
    setEditForm({ ...selectedMeal });
    setIsEditing(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.meal.trim()) return;
    onUpdate(editForm);
    setSelectedMeal(editForm);
    setIsEditing(false);
  };

  const closeMealModal = () => {
    setSelectedMeal(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Meal Plan</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">What's cooking this week?</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="premium" className="!w-auto !py-2 !px-4 text-sm"><Plus className="w-4 h-4"/> Recipe</Button>
      </div>

      <div className="space-y-4">
        {meals.map((meal) => (
          <Card key={meal.id} onClick={() => setSelectedMeal(meal)} className="!p-5 flex flex-col gap-3 group cursor-pointer">
            <div className="flex justify-between items-start">
              <Badge variant={meal.day === 'Today' ? 'premium' : 'default'} className="!text-[10px]">
                {meal.day}
              </Badge>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {meal.prepTime}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Utensils className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 leading-tight">{meal.meal}</h4>
                <div className="flex gap-2 mt-2">
                  {meal.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Recipe">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Recipe Name</label>
            <input type="text" value={meal} onChange={e => setMeal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="e.g., Chicken Parmesan" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Day</label>
              <select value={day} onChange={e => setDay(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                <option>Today</option>
                <option>Tomorrow</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
                <option>Sunday</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Prep Time</label>
              <select value={prepTime} onChange={e => setPrepTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                <option value="15m">15 mins</option>
                <option value="30m">30 mins</option>
                <option value="45m">45 mins</option>
                <option value="1h">1 hour</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="mt-4">Save Recipe</Button>
        </form>
      </Modal>

      {/* View/Edit Recipe Modal */}
      <Modal isOpen={!!selectedMeal} onClose={closeMealModal} title={isEditing ? "Edit Recipe" : (selectedMeal?.meal || "Recipe")}>
        {selectedMeal && !isEditing && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <Badge variant="premium">{selectedMeal.day}</Badge>
              <Badge variant="default">{selectedMeal.prepTime}</Badge>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-900/5">
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Utensils className="w-4 h-4"/> Ingredients</h4>
              <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                {(selectedMeal.ingredients || "").split('\n').map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-900/5">
              <h4 className="font-bold text-slate-800 mb-2">Instructions</h4>
              <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2">
                {(selectedMeal.instructions || "").split('\n').map((item, i) => <li key={i}>{item}</li>)}
              </ol>
            </div>

            <div className="flex gap-3">
              <Button onClick={closeMealModal} variant="secondary" className="flex-1">Close</Button>
              <Button onClick={handleEditClick} className="flex-1">Edit Plan</Button>
            </div>
          </div>
        )}

        {selectedMeal && isEditing && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Recipe Name</label>
              <input type="text" value={editForm.meal} onChange={e => setEditForm({...editForm, meal: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Day</label>
                <select value={editForm.day} onChange={e => setEditForm({...editForm, day: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option>Today</option>
                  <option>Tomorrow</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Prep Time</label>
                <input type="text" value={editForm.prepTime} onChange={e => setEditForm({...editForm, prepTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Ingredients</label>
              <textarea value={editForm.ingredients} onChange={e => setEditForm({...editForm, ingredients: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]" placeholder="One ingredient per line" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Instructions</label>
              <textarea value={editForm.instructions} onChange={e => setEditForm({...editForm, instructions: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]" placeholder="One instruction per line" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={() => setIsEditing(false)} variant="secondary" className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1">Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

const RewardsView = ({ rewards, points, onRedeem }) => {
  return (
    <div className="space-y-6 animate-pop-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Rewards</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Cash in your hard work!</p>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white px-4 py-2 rounded-2xl shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all">
          <Star className="w-5 h-5 fill-white/50" />
          <span className="font-extrabold text-lg">{points} pts</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rewards.map((reward) => (
          <Card key={reward.id} className="!p-5 flex flex-col justify-between gap-4 group">
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${reward.color} group-hover:scale-110 transition-transform duration-300`}>
                {reward.icon}
              </div>
              <Badge variant="warning" className="!bg-amber-100 !text-amber-700 !border-0 shadow-sm flex items-center gap-1">
                <Flame className="w-3 h-3"/> {reward.cost} pts
              </Badge>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-800">{reward.title}</h4>
            </div>

            <Button 
              variant={points >= reward.cost ? 'primary' : 'secondary'} 
              className="!py-2.5 mt-2"
              disabled={points < reward.cost}
              onClick={() => onRedeem(reward.cost)}
            >
              {points >= reward.cost ? 'Redeem Reward' : `Need ${reward.cost - points} more`}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SettingsView = ({ user }) => {
  const [activeModal, setActiveModal] = useState(null);

  const handleModalClose = () => setActiveModal(null);

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Settings</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage family preferences</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="!p-0 overflow-hidden">
          <div className="p-5 flex items-center gap-4 border-b border-slate-100">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-3xl ring-2 ring-white shadow-sm">
                {user.avatar}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">{user.name}</h3>
              <p className="text-sm font-medium text-slate-500">{user.role}</p>
            </div>
            <Button onClick={() => setActiveModal('editProfile')} variant="secondary" className="!w-auto !py-2 !px-4 text-xs ml-auto">Edit</Button>
          </div>
          <div className="p-2">
            <SettingRow onClick={() => setActiveModal('family')} icon={Users} label="Family Members" value="4 Members" />
            <SettingRow onClick={() => setActiveModal('notifications')} icon={BellRing} label="Notifications" value="Enabled" />
            <SettingRow onClick={() => setActiveModal('subscription')} icon={CreditCard} label="Subscription" value="Premium" />
          </div>
        </Card>

        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-2 mt-6 mb-2">App Settings</h3>
        <Card className="!p-2">
          <SettingRow onClick={() => setActiveModal('general')} icon={Settings} label="General Preferences" />
          <SettingRow onClick={() => setActiveModal('logout')} icon={LogOut} label="Log Out" className="text-rose-600" iconClass="text-rose-500 bg-rose-50" hideArrow />
        </Card>
      </div>

      {/* Settings Modals */}
      <Modal isOpen={activeModal === 'editProfile'} onClose={handleModalClose} title="Edit Profile">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
            <input type="text" defaultValue={user.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <Button onClick={handleModalClose} className="mt-2">Save Changes</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'family'} onClose={handleModalClose} title="Family Members">
        <div className="space-y-3">
          {['Sarah (Parent)', 'Dad (Parent)', 'Tommy (Child)', 'Lily (Child)'].map((member, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-medium text-slate-700">{member}</span>
              <Button variant="secondary" className="!w-auto !py-1 !px-3 text-xs">Edit</Button>
            </div>
          ))}
          <Button variant="outline" className="mt-2 w-full border-dashed"><Plus className="w-4 h-4"/> Add Member</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'notifications'} onClose={handleModalClose} title="Notifications">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700">Push Notifications</span>
            <div className="w-12 h-6 bg-indigo-500 rounded-full relative cursor-pointer"><div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700">Daily Digest Email</span>
            <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer"><div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div></div>
          </div>
          <Button onClick={handleModalClose} className="mt-4">Done</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'subscription'} onClose={handleModalClose} title="Subscription">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Premium Plan</h3>
          <p className="text-sm text-slate-500 pb-4">You have access to all features, including AI Copilot and advanced scheduling.</p>
          <Button variant="secondary" onClick={handleModalClose}>Manage Billing</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'general'} onClose={handleModalClose} title="General Preferences">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Language</label>
            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
          <Button onClick={handleModalClose} className="mt-4">Save</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'logout'} onClose={handleModalClose} title="Log Out">
        <div className="space-y-4">
          <p className="text-slate-600">Are you sure you want to log out of FamilyOS?</p>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={handleModalClose} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleModalClose} className="flex-1 !bg-rose-600 hover:!bg-rose-700 !shadow-none">Log Out</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const SettingRow = ({ icon: Icon, label, value, className = '', iconClass = '', hideArrow = false, onClick }) => (
  <div onClick={onClick} className={`flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors ${className}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-slate-100 text-slate-600 ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-bold text-slate-700">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-sm font-medium text-slate-500">{value}</span>}
      {!hideArrow && <ChevronRight className="w-4 h-4 text-slate-400" />}
    </div>
  </div>
);
