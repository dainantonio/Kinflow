import React, { useState, useRef, useEffect, useContext } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { ThemeContext } from '../../contexts/FamilyContext';

// --- SCROLL REVEAL HOOK ---
export const useScrollReveal = () => {
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

export const RevealCard = ({ children, delay = 0 }) => {
  const ref = useScrollReveal();
  return <div ref={ref} className="scroll-reveal animate-in" style={{transitionDelay:`${delay}ms`}}>{children}</div>;
};

export const Card = ({ children, className = '', onClick }) => {
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

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const { isChild } = useContext(ThemeContext);
  const baseStyle = isChild
    ? "w-full font-bold rounded-[1.5rem] py-4 px-4 transition-all duration-200 active:scale-[0.96] flex items-center justify-center gap-2 relative shadow-[0_4px_0_rgb(0,0,0,0.12)] active:shadow-[0_0px_0_rgb(0,0,0)] active:translate-y-1 disabled:opacity-50"
    : "w-full font-semibold rounded-[1.25rem] py-3.5 px-4 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-50 disabled:pointer-events-none";

  const variants = isChild ? {
    primary: "bg-sky-500 text-white hover:bg-sky-400 border-2 border-sky-600",
    secondary: "bg-white text-slate-800 border-2 border-slate-200",
    premium: "bg-amber-400 text-amber-900 hover:bg-amber-300 border-2 border-amber-500",
    outline: "bg-transparent border-2 border-slate-300 text-slate-700"
  } : {
    primary: "bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800",
    secondary: "bg-white/80 backdrop-blur-md text-slate-800 hover:bg-white ring-1 ring-slate-900/10 shadow-sm",
    premium: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]",
    outline: "border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      <div className="relative z-10 flex items-center justify-center gap-2 tracking-wide">{children}</div>
      {!isChild && <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out pointer-events-none rounded-[1.25rem]" style={{ mixBlendMode: 'overlay' }}></div>}
    </button>
  );
};

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const { isChild } = useContext(ThemeContext);
  const variants = {
    default: "bg-slate-100 text-slate-700 ring-1 ring-slate-900/5",
    success: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-900/5",
    warning: "bg-amber-100 text-amber-800 ring-1 ring-amber-900/10",
    premium: "bg-purple-100 text-purple-700 ring-1 ring-purple-900/5",
  };
  return <span className={`${isChild ? 'text-xs px-3 py-1.5 rounded-xl' : 'text-[10px] sm:text-xs px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm'} font-bold ${variants[variant]} ${className}`}>{children}</span>;
};

export const Avatar = ({ user, size = 'md', className = '' }) => {
  if (!user) return null;
  const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-14 h-14 text-2xl', xl: 'w-20 h-20 text-4xl', xxl: 'w-24 h-24 text-4xl' };
  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br ${user.color} text-white font-bold shadow-inner ring-2 ring-white/20 ${sizes[size]} ${className}`}>
      {user.initials}
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, fullHeight = false }) => {
  const { isChild } = useContext(ThemeContext);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/75" onClick={onClose} style={{backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)'}}>
      <div
        className={`${isChild ? 'bg-white rounded-t-[2rem] sm:rounded-[2rem] border-t-8 border-indigo-100' : 'bg-white rounded-t-[2rem] sm:rounded-[2rem]'} w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl ring-1 ring-black/8 relative animate-slide-up cursor-default overflow-hidden`}
        style={{transformOrigin:'bottom center'}}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 pb-3 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
          <div className="flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate pr-4">{title}</h2>
            <button onClick={onClose} className="spring-press p-2 bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className={`px-5 pb-6 overflow-y-auto relative ${fullHeight ? 'flex-1 h-[60vh]' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const Confetti = ({ active }) => {
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

export const NavItem = ({ icon: Icon, label, isActive, isChild, onClick }) => {
  const [bouncing, setBouncing] = useState(false);
  const handleTap = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 500);
    onClick();
  };
  const activeColor = isChild ? 'text-sky-500' : 'text-indigo-600';
  const dotColor = isChild ? 'bg-sky-500' : 'bg-indigo-600';
  return (
    <button
      onClick={handleTap}
      className={`flex flex-col items-center justify-center flex-1 ${isChild ? 'px-3' : 'px-2'} py-2 gap-0.5 relative spring-press group`}
      style={{WebkitTapHighlightColor:'transparent'}}
    >
      <div className={`${bouncing ? 'animate-nav-bounce' : ''} ${isActive ? activeColor : 'text-slate-400'} transition-colors duration-200`}>
        <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
      </div>
      <span className={`${isChild ? 'text-[10px]' : 'text-[9px]'} font-bold tracking-wide ${isActive ? activeColor : 'text-slate-400'} transition-colors`}>{label}</span>
      {isActive && <div className={`absolute bottom-1.5 w-1 h-1 ${dotColor} rounded-full`} />}
    </button>
  );
};

const SETTING_ROW_COLORS = ['bg-indigo-100 text-indigo-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600', 'bg-blue-100 text-blue-600', 'bg-violet-100 text-violet-600'];
let _settingRowIndex = 0;

export const SettingRow = ({ icon: Icon, label, value, className = '', iconClass = '', hideArrow = false, onClick }) => {
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
