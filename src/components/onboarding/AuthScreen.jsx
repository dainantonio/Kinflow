import React, { useState } from 'react';
import { Layers, Loader2, CheckCircle2 } from 'lucide-react';
import { DEMO_MODE } from '../../utils/firebase';

export const AuthScreen = ({ onComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 800);
  };

  const nextSteps = [
    'Create the parent account and sign in on the main device.',
    'Open Profile → Manage Members to add each family member.',
    'Have everyone pick their profile from the profile switcher.',
  ];

  return (
    <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-500/15 rounded-full blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize:'28px 28px'}} />

      <div className="mb-10 text-center animate-bounce-in relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_16px_48px_rgba(99,102,241,0.45)] mb-6 ring-1 ring-white/10">
          <Layers className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-wide mb-2">Orbit</h1>
        <p className="text-white/50 text-sm font-medium">Family organization, simplified.</p>
      </div>

      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/15 shadow-2xl relative z-10 animate-bounce-in" style={{animationDelay:'0.1s'}}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-white/60 mb-1.5 uppercase tracking-widest">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium placeholder:text-white/25" placeholder="parent@family.com" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/60 mb-1.5 uppercase tracking-widest">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium placeholder:text-white/25" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={isLoading} className="spring-press w-full mt-6 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Sign In" : "Create Family Account")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium text-white/50">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
        {DEMO_MODE && (
          <p className="mt-4 text-center text-[10px] font-bold text-white/25 uppercase tracking-widest">Demo Mode · No login required</p>
        )}
      </div>

      <div className="w-full max-w-sm mt-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 relative z-10">
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Quick setup after sign in</p>
        <div className="space-y-1.5">
          {nextSteps.map((stepText) => (
            <div key={stepText} className="flex gap-2.5 items-start text-xs text-white/75">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-300 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{stepText}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
