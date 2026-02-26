import React, { useContext } from 'react';
import { CheckSquare, Calendar as CalendarIcon, Star, ChefHat, ArrowRight, Clock, MapPin } from 'lucide-react';
import { ThemeContext } from '../contexts/FamilyContext';
import { Card, Badge, Avatar, RevealCard } from '../components/shared/Primitives';

export const Dashboard = ({ tasks, events, points, activeUser, isParent, onNavigate }) => {
  const { isChild } = useContext(ThemeContext);
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const visibleTasks = isParent ? tasks : tasks.filter(t => t.assignee === activeUser?.name || t.assignee === 'Anyone');
  const openTasks = visibleTasks.filter(t => t.status === 'open').length;
  const pendingApproval = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-5 animate-bounce-in">
      {/* GREETING HERO */}
      <RevealCard delay={0}>
        <div className="relative overflow-hidden rounded-3xl p-5" style={{background: isChild ? 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)' : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)'}}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <p className="text-indigo-200/70 text-[10px] font-bold uppercase tracking-widest mb-1">{greeting}</p>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
              {isChild ? `Hi, ${activeUser?.name}! 👋` : `${activeUser?.name} 👋`}
            </h1>
            <p className="text-white/40 text-xs font-medium mt-1 mb-4">
              {isParent ? `${openTasks} chores open · ${pendingApproval} need review` : `${openTasks} chores waiting for you`}
            </p>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl ring-1 ring-white/15">
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span className="text-white font-bold text-sm">{points} pts</span>
            </div>
          </div>
        </div>
      </RevealCard>

      {/* PENDING APPROVAL ALERT (parents only) */}
      {isParent && pendingApproval > 0 && (
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
          <div onClick={() => onNavigate('tasks')} className={`spring-press rounded-3xl p-5 cursor-pointer relative overflow-hidden ${isChild ? 'bg-sky-500 shadow-lg shadow-sky-500/25' : 'bg-slate-900 shadow-lg shadow-slate-900/15'}`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-4 translate-x-4" />
            <CheckSquare className={`w-5 h-5 mb-3 ${isChild ? 'text-white/60' : 'text-white/50'}`} strokeWidth={2} />
            <p className="text-4xl font-bold text-white tracking-tight">{openTasks}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-1">Chores left</p>
          </div>
          <div onClick={() => onNavigate('rewards')} className="spring-press bg-white rounded-3xl p-5 cursor-pointer shadow-sm ring-1 ring-black/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-full -translate-y-4 translate-x-4" />
            <Gift className="w-5 h-5 text-amber-500 mb-3" strokeWidth={2} />
            <p className="text-4xl font-bold text-slate-900 tracking-tight">{points}</p>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">{isParent ? 'Family pts' : 'My points'}</p>
          </div>
        </div>
      </RevealCard>

      {/* UPCOMING EVENTS */}
      <RevealCard delay={120}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Up Next</h3>
            {isParent && <button onClick={() => onNavigate('calendar')} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors">View all</button>}
          </div>
          <div className="space-y-2">
            {events.slice(0,2).map((event, i) => (
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
            ))}
            {events.length === 0 && (
              <div className="bg-slate-50 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-slate-600 font-bold text-sm">No events today</p>
                <p className="text-slate-400 text-xs font-medium mt-1">Your schedule is wide open 🎉</p>
                {isParent && <button onClick={() => onNavigate('calendar')} className="mt-3 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors">Add Event</button>}
              </div>
            )}
          </div>
        </div>
      </RevealCard>

      {/* QUICK ACTIONS (parent only) */}
      {isParent && (
        <RevealCard delay={160}>
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                {icon: CheckSquare, label: 'Tasks', tab: 'tasks', color: 'bg-emerald-100 text-emerald-600'},
                {icon: CalendarIcon, label: 'Schedule', tab: 'calendar', color: 'bg-blue-100 text-blue-600'},
                {icon: ChefHat, label: 'Meals', tab: 'meals', color: 'bg-orange-100 text-orange-500'},
                {icon: MessageCircle, label: 'Chat', tab: 'chat', color: 'bg-pink-100 text-pink-500'},
              ].map((a, i) => (
                <button key={a.tab} onClick={() => onNavigate(a.tab)} className="spring-press flex flex-col items-center gap-2 bg-white rounded-2xl p-3 shadow-sm ring-1 ring-black/5" style={{animationDelay:`${i*60}ms`}}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                    <a.icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 tracking-wide leading-tight text-center">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </RevealCard>
      )}
    </div>
  );
};

