import React from 'react';
import { Layers } from 'lucide-react';

export const SplashScreen = () => (
  <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
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
