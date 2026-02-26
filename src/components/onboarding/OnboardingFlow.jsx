import React, { useState } from 'react';
import { Layers, Users, Check, Plus, CheckSquare, Star, Gift } from 'lucide-react';

export const OnboardingFlow = ({ onComplete, userRole }) => {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const isParentFlow = userRole === 'Parent';
  const totalSteps = isParentFlow ? 4 : 4;

  const advance = (next) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      if (next >= totalSteps) { onComplete(); return; }
      setStep(next);
      setAnimating(false);
    }, 220);
  };

  const parentSlides = [
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
      sub: "Your family's command center. Let's set things up so your household runs smoothly.",
      cta: 'Get Started'
    },
    {
      bg: 'bg-white',
      dark: false,
      visual: (
        <div className="w-full max-w-xs mb-8">
          <div className="bg-slate-50 rounded-[1.5rem] p-5 ring-1 ring-slate-100 shadow-sm mb-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600"><Users className="w-5 h-5" /></div>
              <div>
                <span className="text-sm font-bold text-slate-700 block">Add Your Kids</span>
                <span className="text-[10px] font-medium text-slate-400">They'll get their own profiles</span>
              </div>
            </div>
            <div className="space-y-2">
              {['Tommy', 'Sara'].map(name => (
                <div key={name} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 ring-1 ring-slate-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{name[0]}</div>
                  <span className="text-sm font-bold text-slate-700">{name}</span>
                  <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                </div>
              ))}
              <div className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 ring-1 ring-dashed ring-slate-200 text-slate-300">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add another child...</span>
              </div>
            </div>
          </div>
        </div>
      ),
      heading: (<>Add your<br/>family members</>),
      sub: 'Each child gets their own profile with age-appropriate views and personal task lists.',
      cta: 'Next: Create Tasks'
    },
    {
      bg: 'bg-gradient-to-br from-emerald-50 via-white to-sky-50',
      dark: false,
      visual: (
        <div className="w-full max-w-xs mb-8">
          <div className="space-y-3">
            {[
              { title: 'Empty Dishwasher', assignee: 'Tommy', pts: 10, icon: '🍽️', color: 'bg-emerald-100' },
              { title: 'Make Your Bed', assignee: 'Sara', pts: 5, icon: '🛏️', color: 'bg-blue-100' },
              { title: 'Walk the Dog', assignee: 'Anyone', pts: 20, icon: '🐕', color: 'bg-amber-100' },
            ].map(task => (
              <div key={task.title} className="bg-white rounded-[1.5rem] p-4 shadow-md ring-1 ring-slate-100 flex items-center gap-3">
                <div className={`w-11 h-11 ${task.color} rounded-xl flex items-center justify-center text-lg`}>{task.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">{task.title}</p>
                  <p className="text-[10px] font-medium text-slate-400">Assigned to {task.assignee}</p>
                </div>
                <div className="bg-amber-100 px-2 py-1 rounded-lg">
                  <span className="text-[10px] font-bold text-amber-700">{task.pts} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      heading: (<>Create your<br/>first tasks</>),
      sub: 'Assign chores with point values. Kids see only their tasks and earn points by completing them.',
      cta: 'Next: Set Rewards'
    },
    {
      bg: 'bg-gradient-to-br from-indigo-50 via-white to-purple-50',
      dark: false,
      visual: (
        <div className="flex flex-col items-center mb-8 w-full max-w-xs">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-6">
            <Gift className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex gap-3 w-full">
            {[
              { pts: '50 pts', label: 'Movie Night', icon: '🎬' },
              { pts: '100 pts', label: 'New Game', icon: '🎮' },
              { pts: '200 pts', label: 'Pizza Party', icon: '🍕' },
            ].map(item => (
              <div key={item.label} className="flex-1 bg-white rounded-[1.5rem] p-4 text-center shadow-md shadow-slate-100 ring-1 ring-slate-100">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-xs font-bold text-amber-600 mb-0.5">{item.pts}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
      heading: (<>Set up<br/>rewards</>),
      sub: 'Create rewards your kids actually want. They redeem points when they earn enough.',
      cta: "Let's Go!"
    }
  ];

  const childSlides = [
    {
      bg: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
      dark: true,
      visual: (
        <div className="relative flex items-center justify-center mb-10">
          <div className="absolute w-48 h-48 bg-white/10 rounded-full blur-[60px]" />
          <div className="grid grid-cols-4 gap-3 mb-2">
            {['🦊', '🐼', '🦄', '🐸', '🦁', '🐱', '🐶', '🐰'].map((a, i) => (
              <div key={i} className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${i === 2 ? 'bg-white/30 ring-2 ring-white scale-110 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>
                {a}
              </div>
            ))}
          </div>
        </div>
      ),
      heading: (<>Pick your<br/>avatar!</>),
      sub: "Choose a character that represents you. You can always change it later!",
      cta: 'Cool!'
    },
    {
      bg: 'bg-white',
      dark: false,
      visual: (
        <div className="w-full max-w-xs mb-8">
          <div className="bg-emerald-50 rounded-[1.5rem] p-5 ring-1 ring-emerald-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">Your Chores</span>
            </div>
            <div className="space-y-2">
              {[
                { title: 'Empty Dishwasher', pts: 10, icon: '🍽️' },
                { title: 'Make Your Bed', pts: 5, icon: '🛏️' },
                { title: 'Homework Time', pts: 15, icon: '📚' },
              ].map(t => (
                <div key={t.title} className="bg-white rounded-xl px-3 py-3 flex items-center gap-3 ring-1 ring-emerald-100">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-sm font-bold text-slate-700 flex-1">{t.title}</span>
                  <div className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-lg">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-amber-700">{t.pts}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      heading: (<>Here are<br/>your tasks</>),
      sub: 'Complete chores assigned by your parents to earn points. Tap any task to get started!',
      cta: 'Got It!'
    },
    {
      bg: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50',
      dark: false,
      visual: (
        <div className="w-full max-w-xs mb-8 flex flex-col items-center">
          <div className="bg-white rounded-[1.5rem] p-5 shadow-lg ring-1 ring-slate-100 w-full max-w-[260px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-lg">🍽️</div>
              <div>
                <p className="text-sm font-bold text-slate-700">Empty Dishwasher</p>
                <p className="text-[10px] font-medium text-slate-400">10 points</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-5 h-5 rounded-full border-2 border-emerald-400 flex items-center justify-center bg-emerald-50"><Check className="w-3 h-3 text-emerald-500" /></div>
                <span className="text-xs font-medium line-through">Open the dishwasher</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-5 h-5 rounded-full border-2 border-emerald-400 flex items-center justify-center bg-emerald-50"><Check className="w-3 h-3 text-emerald-500" /></div>
                <span className="text-xs font-medium line-through">Put dishes away</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                <span className="text-xs font-bold text-slate-700">Close and start cycle</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl">✅ Mark Complete</button>
          </div>
        </div>
      ),
      heading: (<>Finish tasks,<br/>earn points</>),
      sub: 'Follow the steps, mark complete, and wait for approval. Points appear instantly!',
      cta: 'Next'
    },
    {
      bg: 'bg-gradient-to-br from-amber-50 via-white to-orange-50',
      dark: false,
      visual: (
        <div className="flex flex-col items-center mb-8 w-full max-w-xs">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-6">
            <Gift className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <div className="bg-white rounded-[1.5rem] p-4 shadow-lg ring-1 ring-slate-100 w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700">Your Progress</span>
              <span className="text-sm font-bold text-amber-600">35 / 50 pts</span>
            </div>
            <div className="h-3 bg-amber-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{width:'70%'}} />
            </div>
            <div className="flex items-center gap-3 bg-amber-50 rounded-xl px-3 py-2.5 ring-1 ring-amber-200">
              <span className="text-2xl">🎬</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Movie Night</p>
                <p className="text-[10px] font-medium text-amber-600">Just 15 more points!</p>
              </div>
            </div>
          </div>
        </div>
      ),
      heading: (<>Spend points<br/>on rewards!</>),
      sub: 'Save up your points and redeem them for awesome rewards your parents set up.',
      cta: "Let's Go! 🎉"
    }
  ];

  const slides = isParentFlow ? parentSlides : childSlides;

  const s = slides[step];

  return (
    <div className={`min-h-[100dvh] flex flex-col transition-all duration-500 ${s.bg} relative overflow-hidden`}>
      {step === 0 && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '28px 28px'}} />
        </>
      )}

      {step < totalSteps - 1 && (
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
          {Array.from({length: totalSteps}, (_, i) => i).map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? (s.dark ? 'w-8 bg-white' : 'w-8 bg-slate-800') : (s.dark ? 'w-2 bg-white/20' : 'w-2 bg-slate-200')}`} />
          ))}
        </div>
        <button
          onClick={() => advance(step + 1)}
          className={`w-full py-4 rounded-[1.25rem] font-bold text-base transition-all active:scale-[0.97] shadow-lg ${
            step === 0
              ? 'bg-white text-slate-900 shadow-white/10 hover:bg-white/95'
              : step === totalSteps - 1
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

