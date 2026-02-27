import React, { useState, useContext } from 'react';
import { ChevronLeft, Camera, Bell, Settings, CreditCard, Users, HelpCircle, LogOut, ChevronRight, Check, Plus, Star, User, BellRing, Trash2, X } from 'lucide-react';
import { ThemeContext, ALL_AVATARS } from '../contexts/FamilyContext';
import { Card, Avatar, Modal, SettingRow, Button } from '../components/shared/Primitives';

const COLOR_OPTIONS = [
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-400 to-teal-500',
  'from-purple-500 to-indigo-500',
  'from-amber-400 to-orange-500',
  'from-red-500 to-pink-500',
];

export const PreferencesPanel = ({ onClose }) => {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kinflow_preferences') || 'null') || { weekStart: 'sunday', currency: 'USD', autoApprove: false, soundEffects: true, compactMode: false }; }
    catch(e) { return { weekStart: 'sunday', currency: 'USD', autoApprove: false, soundEffects: true, compactMode: false }; }
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      try { localStorage.setItem('kinflow_preferences', JSON.stringify(prefs)); } catch(e) {}
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 400);
  };

  const togglePref = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-5">
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl ring-1 ring-emerald-200 animate-slide-up">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">Preferences saved!</span>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">General</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
            <div>
              <p className="font-bold text-sm text-slate-800">Week Starts On</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Calendar & schedule layout</p>
            </div>
            <select value={prefs.weekStart} onChange={e => setPrefs(p => ({...p, weekStart: e.target.value}))} className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
            <div>
              <p className="font-bold text-sm text-slate-800">Currency</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">For reward values</p>
            </div>
            <select value={prefs.currency} onChange={e => setPrefs(p => ({...p, currency: e.target.value}))} className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="points">Points only</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Behavior</p>
        <div className="space-y-3">
          {[
            { key: 'autoApprove', label: 'Auto-Approve Tasks', sub: 'Skip approval step for simple chores' },
            { key: 'soundEffects', label: 'Sound Effects', sub: 'Play sounds on points & rewards' },
            { key: 'compactMode', label: 'Compact Mode', sub: 'Smaller cards, more content on screen' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
              <div>
                <p className="font-bold text-sm text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{item.sub}</p>
              </div>
              <button onClick={() => togglePref(item.key)} className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${prefs[item.key] ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${prefs[item.key] ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className={`spring-press w-full py-4 rounded-2xl font-bold text-base shadow-md mt-2 transition-all ${saving ? 'bg-slate-300 text-slate-500' : 'bg-slate-900 text-white shadow-slate-900/20'}`}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};

export const SettingsView = ({ user, isParent, onLogout, allUsers = [], userPoints = {}, tasks = [], onBack, onUpdateProfile, onAddMember, onUpdateMember, onRemoveMember, theme = 'indigo', onThemeChange }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [editName, setEditName] = useState(user?.name || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kinflow_notifPrefs') || 'null') || { choreReminders: true, approvals: true, chatMessages: false }; }
    catch(e) { return { choreReminders: true, approvals: true, chatMessages: false }; }
  });

  // Manage Members state
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Child');
  const [newMemberColor, setNewMemberColor] = useState(COLOR_OPTIONS[0]);
  const [newMemberAvatar, setNewMemberAvatar] = useState('👦🏾');
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);

  const handleModalClose = () => { setActiveModal(null); setProfileSaved(false); setEditingMemberId(null); setShowAddMemberForm(false); setConfirmRemoveMember(null); };

  const handleSaveProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile({ ...user, name: editName });
    }
    try { localStorage.setItem('kinflow_lastProfile', JSON.stringify({ ...user, name: editName })); } catch(e) {}
    setProfileSaved(true);
    setTimeout(() => { handleModalClose(); }, 1200);
  };

  const toggleNotif = (key) => {
    setNotifPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('kinflow_notifPrefs', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });
  };

  const handleStartEditMember = (member) => {
    setEditingMemberId(member.id);
    setEditingMemberName(member.name);
  };

  const handleSaveMemberEdit = (member) => {
    if (onUpdateMember && editingMemberName.trim()) {
      onUpdateMember({ ...member, name: editingMemberName.trim(), initials: editingMemberName.trim().charAt(0).toUpperCase() });
    }
    setEditingMemberId(null);
  };

  const handleAddNewMember = () => {
    if (onAddMember && newMemberName.trim()) {
      onAddMember({ name: newMemberName.trim(), role: newMemberRole, color: newMemberColor, avatar: newMemberAvatar });
      setNewMemberName('');
      setNewMemberRole('Child');
      setNewMemberColor(COLOR_OPTIONS[0]);
      setShowAddMemberForm(false);
    }
  };

  const handleConfirmRemove = (memberId) => {
    if (onRemoveMember) {
      onRemoveMember(memberId);
    }
    setConfirmRemoveMember(null);
  };

  const myPoints = userPoints[user?.name] || 0;
  const totalPoints = Object.values(userPoints).reduce((a, b) => a + b, 0);
  const completedTasks = tasks.filter(t => t.status === 'approved' && (!isParent || true)).length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const myCompleted = tasks.filter(t => t.status === 'approved' && t.assignee === user?.name).length;

  const stats = isParent
    ? [
        { label: 'Family Pts', value: totalPoints, emoji: '⭐' },
        { label: 'Done', value: completedTasks, emoji: '✓' },
        { label: 'Pending', value: pendingCount, emoji: '⏳' },
      ]
    : [
        { label: 'My Points', value: myPoints, emoji: '⭐' },
        { label: 'Completed', value: myCompleted, emoji: '✓' },
        { label: 'Day Streak', value: '5', emoji: '🔥' },
      ];

  return (
    <div className="animate-bounce-in -mx-4 sm:-mx-6 -mt-6">

      {/* HERO BANNER */}
      <div className="relative h-44 overflow-hidden" style={{background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'}}>
        <div className="absolute top-[-20%] right-[-5%] w-72 h-72 bg-indigo-400/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[-5%] w-64 h-64 bg-violet-400/15 rounded-full blur-[60px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize:'20px 20px'}} />
        {onBack && (
          <button onClick={onBack} className="spring-press absolute top-5 left-4 w-9 h-9 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all z-10">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="absolute top-5 right-4 z-10">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Profile</span>
        </div>
      </div>

      {/* AVATAR OVERLAP */}
      <div className="flex flex-col items-center -mt-14 pb-5 px-4">
        <div className="relative mb-4">
          <Avatar user={user} size="xxl" className="ring-[5px] ring-white shadow-2xl shadow-slate-900/20" />
          <button
            onClick={() => setActiveModal('editProfile')}
            className="absolute bottom-1 right-1 w-8 h-8 bg-slate-900 border-[2.5px] border-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-700 active:scale-90 transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.name}</h2>
        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isParent ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {user?.role}
          </span>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500">Orbit Family</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-32 space-y-5">

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`rounded-2xl p-4 text-center shadow-sm ring-1 ring-black/5 ${i===0 ? 'bg-indigo-50' : i===1 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <div className="text-xl mb-1.5">{stat.emoji}</div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* YOUR FAMILY */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Your Family</h3>
          <div className="bg-white rounded-[1.75rem] ring-1 ring-slate-900/5 p-4 shadow-sm">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {allUsers.map(u => (
                <div
                  key={u.id}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${u.id === user?.id ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'hover:bg-slate-50'}`}
                >
                  <Avatar user={u} size="md" />
                  <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">{u.name}</span>
                  <span className="text-[9px]">{u.role === 'Parent' ? '👑' : '⭐'}</span>
                </div>
              ))}
            </div>
            {isParent && (
              <button
                onClick={() => setActiveModal('family')}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" /> Manage Members
              </button>
            )}
          </div>
        </div>

        {/* ACCOUNT SETTINGS */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Account</h3>
          <div className="bg-white rounded-[1.75rem] ring-1 ring-slate-900/5 overflow-hidden shadow-sm divide-y divide-slate-50">
            <SettingRow onClick={() => setActiveModal('editProfile')} icon={User} label="Edit Profile" value={user?.name} />
            <SettingRow onClick={() => setActiveModal('notifications')} icon={BellRing} label="Notifications" value="Enabled" />
            {isParent && (
              <SettingRow onClick={() => setActiveModal('subscription')} icon={CreditCard} label="Subscription" value={<span className="text-indigo-600 font-bold">Premium ✦</span>} />
            )}
          </div>
        </div>

        {/* SUBSCRIPTION CARD (parents only) */}
        {isParent && (
          <div className="relative overflow-hidden rounded-[1.75rem] p-5 shadow-lg" style={{background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'}}>
            <div className="absolute top-[-20%] right-[-5%] w-40 h-40 bg-white/10 rounded-full blur-[40px]" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Premium Plan</span>
                </div>
                <h4 className="text-xl font-bold text-white leading-tight mb-1">Orbit Family</h4>
                <p className="text-white/60 text-xs font-medium">All features unlocked · AI Copilot included</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-white text-xs font-bold">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* APPEARANCE / THEMES */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Appearance</h3>
          <div className="bg-white rounded-[1.75rem] ring-1 ring-slate-900/5 overflow-hidden shadow-sm divide-y divide-slate-50">
            <SettingRow onClick={() => setActiveModal('themes')} icon={Settings} label="App Theme" value={theme.charAt(0).toUpperCase() + theme.slice(1)} />
          </div>
        </div>

        {isParent && (
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">Preferences</h3>
            <div className="bg-white rounded-[1.75rem] ring-1 ring-slate-900/5 overflow-hidden shadow-sm divide-y divide-slate-50">
              <SettingRow icon={Settings} label="App Preferences" onClick={() => setActiveModal('preferences')} />
            </div>
          </div>
        )}

        {/* SIGN OUT */}
        <button
          onClick={() => setActiveModal('logout')}
          className="w-full py-4 rounded-[1.25rem] bg-rose-50 text-rose-600 font-bold text-sm ring-1 ring-rose-100 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>

      </div>

      {/* MODALS */}
      <Modal isOpen={activeModal === 'editProfile'} onClose={handleModalClose} title="Edit Profile">
        <div className="space-y-4">
          <div className="flex flex-col items-center mb-6">
            <Avatar user={user} size="xl" className="ring-4 ring-white shadow-md mb-4" />
            <p className="text-xs font-semibold text-slate-500">Tap avatar above to change photo</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Display Name</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Role</label>
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-medium text-sm">{user?.role} (cannot change)</div>
          </div>
          {profileSaved && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl ring-1 ring-emerald-200 animate-slide-up">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">Saved!</span>
            </div>
          )}
          <Button onClick={handleSaveProfile} className="mt-2">Save Changes</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'family'} onClose={handleModalClose} title="Family Members">
        <div className="space-y-3">
          {allUsers.map((member) => (
            <div key={member.id} className="p-4 bg-slate-50 rounded-[1.25rem] ring-1 ring-slate-100">
              {editingMemberId === member.id ? (
                <div className="flex items-center gap-3">
                  <Avatar user={member} size="sm" />
                  <input
                    type="text"
                    value={editingMemberName}
                    onChange={e => setEditingMemberName(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium text-slate-800 text-sm"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveMemberEdit(member); }}
                  />
                  <button onClick={() => handleSaveMemberEdit(member)} className="spring-press px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">Save</button>
                  <button onClick={() => setEditingMemberId(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar user={member} size="sm" />
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">{member.name}</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{member.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" className="!w-auto !py-1.5 !px-3 text-xs" onClick={() => handleStartEditMember(member)}>Edit</Button>
                    {member.id !== user?.id && (
                      confirmRemoveMember === member.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleConfirmRemove(member.id)} className="spring-press px-2 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg">Remove</button>
                          <button onClick={() => setConfirmRemoveMember(null)} className="px-2 py-1.5 text-slate-400 text-[10px] font-bold">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRemoveMember(member.id)} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {showAddMemberForm ? (
            <div className="p-4 bg-indigo-50 rounded-[1.25rem] ring-1 ring-indigo-200 space-y-3 animate-bounce-in">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Name</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium text-slate-800 text-sm"
                  placeholder="Enter name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
                <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium text-slate-800 text-sm">
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewMemberColor(color)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} transition-all ${newMemberColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Avatar</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_AVATARS.slice(0, 12).map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewMemberAvatar(emoji)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xl transition-all ${newMemberAvatar === emoji ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110' : 'bg-slate-50 hover:bg-slate-100'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowAddMemberForm(false)} className="flex-1 py-2.5 rounded-xl font-bold text-sm border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleAddNewMember} disabled={!newMemberName.trim()} className="spring-press flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-900 text-white shadow-md disabled:opacity-50">Add Member</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddMemberForm(true)} className="w-full mt-2 py-3 rounded-[1.25rem] border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Member
            </button>
          )}
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'notifications'} onClose={handleModalClose} title="Notifications">
        <div className="space-y-4">
          {[
            { key: 'choreReminders', label: 'Chore Reminders', sub: 'Get notified when tasks are assigned' },
            { key: 'approvals', label: 'Approvals', sub: 'Alert when a child submits proof' },
            { key: 'chatMessages', label: 'Chat Messages', sub: 'Family chat notifications' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
              <div>
                <p className="font-bold text-sm text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{item.sub}</p>
              </div>
              <button onClick={() => toggleNotif(item.key)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${notifPrefs[item.key] ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${notifPrefs[item.key] ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
        <Button onClick={handleModalClose} className="mt-5">Done</Button>
      </Modal>

      <Modal isOpen={activeModal === 'subscription'} onClose={handleModalClose} title="Subscription">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[1.5rem] p-5" style={{background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'}}>
            <Star className="w-8 h-8 text-amber-300 fill-amber-300 mb-3" />
            <h4 className="text-lg font-bold text-white mb-1">Premium Family Plan</h4>
            <p className="text-white/60 text-sm">All features · AI Copilot · Unlimited members</p>
          </div>
          <Button onClick={handleModalClose} variant="secondary">Close</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'themes'} onClose={handleModalClose} title="App Theme">
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-500">Pick a color mood for Orbit.</p>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { id: 'indigo', colors: 'from-indigo-500 to-violet-600' },
              { id: 'ocean', colors: 'from-cyan-500 to-blue-500' },
              { id: 'sunset', colors: 'from-orange-400 to-rose-500' },
              { id: 'forest', colors: 'from-emerald-500 to-teal-600' },
              { id: 'grape', colors: 'from-fuchsia-500 to-purple-600' },
            ].map(t => (
              <button key={t.id} onClick={() => onThemeChange && onThemeChange(t.id)} className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.colors} ring-2 transition-all ${theme === t.id ? 'ring-slate-900 scale-110' : 'ring-transparent'}`} aria-label={t.id}>
                {theme === t.id && <Check className="w-3.5 h-3.5 text-white mx-auto" />}
              </button>
            ))}
          </div>
          <Button onClick={handleModalClose} variant="secondary">Done</Button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'preferences'} onClose={handleModalClose} title="App Preferences">
        <PreferencesPanel onClose={handleModalClose} />
      </Modal>

      <Modal isOpen={activeModal === 'logout'} onClose={handleModalClose} title="Sign Out">
        <div className="space-y-4">
          <p className="text-slate-600 font-medium">Are you sure you want to sign out of Orbit?</p>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={handleModalClose} className="flex-1">Cancel</Button>
            <Button onClick={() => { handleModalClose(); onLogout(); }} className="flex-1 !bg-rose-500 hover:!bg-rose-600 !shadow-none">Sign Out</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
