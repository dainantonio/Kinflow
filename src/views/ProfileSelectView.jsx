import React, { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { Avatar } from '../components/shared/Primitives';

const COLOR_OPTIONS = [
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-400 to-teal-500',
  'from-purple-500 to-indigo-500',
  'from-amber-400 to-orange-500',
  'from-red-500 to-pink-500',
];

export const ProfileSelectorScreen = ({ onLogin, users, onLogout, onAddMember }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Child');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);

  const handleAddMember = () => {
    if (onAddMember && newName.trim()) {
      onAddMember({ name: newName.trim(), role: newRole, color: newColor });
      setNewName('');
      setNewRole('Child');
      setNewColor(COLOR_OPTIONS[0]);
      setShowAddForm(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-500/15 rounded-full blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize:'28px 28px'}} />

      <div className="mb-12 text-center animate-bounce-in relative z-10 flex flex-col items-center">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[1.25rem] flex items-center justify-center shadow-[0_12px_40px_rgba(99,102,241,0.4)] mb-6 ring-1 ring-white/10">
          <Layers className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Who's using Kinflow?</h1>
        <p className="text-white/35 text-sm font-medium">Select your profile to continue</p>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-10 w-full max-w-xs animate-bounce-in relative z-10" style={{animationDelay: '0.15s'}}>
        {users.map((u, i) => (
          <div key={u.id} onClick={() => onLogin(u)} className="spring-press flex flex-col items-center gap-3 cursor-pointer group" style={{animationDelay:`${i*80}ms`}}>
            <div className="relative">
              <Avatar user={u} size="xxl" className="group-hover:scale-[1.08] transition-all duration-300 shadow-2xl ring-4 ring-white/10 group-hover:ring-white/25 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-sm font-bold bg-white/10 backdrop-blur-sm">
                {u.role === 'Parent' ? '👑' : '⭐'}
              </div>
            </div>
            <div className="text-center">
              <span className="font-bold text-base tracking-wide text-white/80 group-hover:text-white transition-colors block">{u.name}</span>
              <span className="text-white/30 text-xs font-semibold">{u.role}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Profile Button */}
      {onAddMember && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-10 relative z-10 flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-white/20 text-white/50 text-sm font-semibold hover:border-white/40 hover:text-white/70 transition-colors animate-bounce-in"
          style={{animationDelay: '0.3s'}}
        >
          <Plus className="w-4 h-4" /> Add Profile
        </button>
      )}

      {/* Add Profile Form */}
      {onAddMember && showAddForm && (
        <div className="mt-8 relative z-10 w-full max-w-xs bg-white/10 backdrop-blur-sm rounded-2xl p-5 ring-1 ring-white/10 space-y-3 animate-bounce-in">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            autoFocus
          />
          <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [&>option]:text-slate-900">
            <option value="Parent">Parent</option>
            <option value="Child">Child</option>
          </select>
          <div className="flex gap-2 justify-center">
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${color} transition-all ${newColor === color ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-white/20 text-white/60 hover:text-white/80 transition-colors">Cancel</button>
            <button onClick={handleAddMember} disabled={!newName.trim()} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-indigo-500 text-white shadow-md disabled:opacity-50 hover:bg-indigo-400 transition-colors">Add</button>
          </div>
        </div>
      )}

      <button onClick={onLogout} className="absolute bottom-10 text-white/30 hover:text-white/70 text-xs font-bold uppercase tracking-widest transition-colors z-10">
        Sign out of Kinflow Account
      </button>
    </div>
  );
};
