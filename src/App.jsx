import React, { useState, useRef, useEffect } from 'react';
import {
  Home, CheckSquare, ChefHat, Gift, MessageCircle, Bell, BellRing,
  Wand2, Settings, MoreHorizontal, ArrowLeftRight, HelpCircle, LogOut,
  Calendar as CalendarIcon, UserCircle, Check
} from 'lucide-react';

import { ThemeContext, FamilyProvider, useFamilyContext } from './contexts/FamilyContext';
import { MOCK_USERS, mockRewards } from './utils/demoData';
import { CustomStyles } from './components/shared/CustomStyles';
import { Avatar, Modal, Confetti, NavItem } from './components/shared/Primitives';
import { SplashScreen } from './components/onboarding/SplashScreen';
import { AuthScreen } from './components/onboarding/AuthScreen';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AICopilotModal } from './components/onboarding/AICopilotModal';
import { ProfileSelectorScreen } from './views/ProfileSelectView';
import { Dashboard } from './views/DashboardView';
import { TasksView } from './views/TasksView';
import { ChatView } from './views/ChatView';
import { CalendarView } from './views/CalendarView';
import { MealsView } from './views/MealsView';
import { RewardsView } from './views/RewardsView';
import { SettingsView } from './views/SettingsView';

function AppInner() {
  const ctx = useFamilyContext();
  const {
    showSplash, activeTab, setActiveTab,
    moreMenuOpen, setMoreMenuOpen,
    isProfileMenuOpen, setIsProfileMenuOpen,
    activeUser, setActiveUser,
    isUserSwitcherOpen, setIsUserSwitcherOpen,
    showOnboarding,
    isLoggedIn, setIsLoggedIn,
    confirmActionState, setConfirmActionState,
    isNotifModalOpen, setIsNotifModalOpen,
    latestToast,
    tasks, messages, userPoints, events, meals,
    groceries, setGroceries,
    showConfetti, isCopilotOpen, setIsCopilotOpen,
    lastRedeemed,
    isParent, isChild,
    handleLogin, completeOnboarding,
    handleAddTask, requestDeleteTask, handleTaskAction,
    handleSendMessage, requestDeleteMessage,
    handleRedeemReward,
    handleAddEvent, requestDeleteEvent,
    handleAddMeal, handleUpdateMeal, requestDeleteMeal,
    handleUpdateProfile,
    myNotifications, unreadNotifsCount, markNotifsAsRead,
  } = ctx;

  const renderContent = () => {
    const displayPoints = isParent ? (userPoints['Tommy'] + userPoints['Lily']) : (userPoints[activeUser?.name] || 0);
    switch(activeTab) {
      case 'home': return <Dashboard tasks={tasks} events={events} points={displayPoints} activeUser={activeUser} isParent={isParent} onNavigate={setActiveTab} />;
      case 'tasks': return <TasksView tasks={tasks} onAction={handleTaskAction} onAdd={handleAddTask} onDelete={requestDeleteTask} activeUser={activeUser} isParent={isParent} />;
      case 'calendar': return <CalendarView events={events} onAdd={handleAddEvent} onDelete={requestDeleteEvent} isParent={isParent} />;
      case 'meals': return <MealsView meals={meals} onAdd={handleAddMeal} onUpdate={handleUpdateMeal} onDelete={requestDeleteMeal} isParent={isParent} groceries={groceries} setGroceries={setGroceries} />;
      case 'rewards': return <RewardsView rewards={mockRewards} points={displayPoints} onRedeem={handleRedeemReward} isParent={isParent} lastRedeemed={lastRedeemed} />;
      case 'chat': return <ChatView messages={messages} onSend={handleSendMessage} onDelete={requestDeleteMessage} tasks={tasks} />;
      case 'settings': return <SettingsView user={activeUser} isParent={isParent} onLogout={() => { setIsLoggedIn(false); setActiveUser(null); try { localStorage.removeItem('kinflow_lastProfile'); localStorage.removeItem('kinflow_loggedIn'); } catch(e) {} }} allUsers={MOCK_USERS} userPoints={userPoints} tasks={tasks} onBack={() => setActiveTab('home')} onUpdateProfile={handleUpdateProfile} />;
      default: return null;
    }
  };

  if (showSplash) return <SplashScreen />;
  if (!isLoggedIn) return <AuthScreen onComplete={() => { setIsLoggedIn(true); try { localStorage.setItem('kinflow_loggedIn', 'true'); } catch(e) {} }} />;
  if (!activeUser) return <ProfileSelectorScreen onLogin={handleLogin} users={MOCK_USERS} onLogout={() => { setIsLoggedIn(false); setActiveUser(null); try { localStorage.removeItem('kinflow_lastProfile'); localStorage.removeItem('kinflow_loggedIn'); } catch(e) {} }} />;
  if (showOnboarding) return <OnboardingFlow onComplete={completeOnboarding} userRole={activeUser?.role} />;

  const primaryNavItems = isParent
    ? [{ id: 'home', icon: Home, label: 'Today' }, { id: 'tasks', icon: CheckSquare, label: 'Tasks' }, { id: 'meals', icon: ChefHat, label: 'Meals' }, { id: 'chat', icon: MessageCircle, label: 'Chat' }]
    : [{ id: 'home', icon: Home, label: 'Home' }, { id: 'tasks', icon: CheckSquare, label: 'Chores' }, { id: 'chat', icon: MessageCircle, label: 'Chat' }, { id: 'rewards', icon: Gift, label: 'Rewards' }];
  const moreNavItems = isParent
    ? [{ id: 'calendar', icon: CalendarIcon, label: 'Plan' }, { id: 'rewards', icon: Gift, label: 'Rewards' }, { id: 'settings', icon: UserCircle, label: 'Profile' }]
    : [];
  const navItems = primaryNavItems;

  const appBgClass = isChild ? 'bg-gradient-to-br from-sky-100 via-blue-50 to-amber-50 text-slate-800' : 'bg-slate-50 text-slate-800';

  return (
    <ThemeContext.Provider value={{ isChild, user: activeUser }}>
      <div className={`h-full font-sans flex flex-col relative transition-colors duration-500 ${appBgClass}`} style={{minHeight:'100dvh', maxHeight:'100dvh', overflow:'hidden'}}>
        <CustomStyles />
        <Confetti active={showConfetti} />

        {/* PREMIUM TOAST */}
        {latestToast && (
          <div className="fixed top-0 inset-x-0 z-[100] flex justify-center" style={{paddingTop:'calc(max(env(safe-area-inset-top, 12px), 12px) + 4px)'}}>
            <div className="mx-4 bg-slate-900/95 backdrop-blur-xl text-white px-5 py-4 rounded-3xl shadow-2xl ring-1 ring-white/10 flex items-center gap-3 animate-slide-up max-w-sm w-full">
              <div className="w-9 h-9 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">{latestToast.title}</p>
                <p className="text-white/50 text-xs font-medium mt-0.5 truncate">{latestToast.body}</p>
              </div>
            </div>
          </div>
        )}

        {/* TOP APP BAR */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-30" style={{background:'rgba(248,250,252,0.95)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', paddingTop:'max(env(safe-area-inset-top, 12px), 12px)'}}>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{
              {home:'Today', tasks:'Tasks', calendar:'Schedule', meals:'Meals', chat:'Family', rewards:'Rewards', settings:'Profile'}[activeTab] || 'Kinflow'
            }</p>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Kinflow</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Copilot button (parents) */}
            {isParent && (
              <button onClick={() => setIsCopilotOpen(true)} className="spring-press w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Wand2 className="w-4 h-4 text-white" strokeWidth={2} />
              </button>
            )}
            {/* Notifications bell */}
            <button onClick={() => { setIsNotifModalOpen(true); markNotifsAsRead(); }} className="spring-press relative w-9 h-9 bg-white rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-black/5">
              <Bell className="w-4 h-4 text-slate-700" strokeWidth={2} />
              {unreadNotifsCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{unreadNotifsCount}</span>}
            </button>
            {/* Profile dropdown */}
            <div className="relative">
              <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="spring-press">
                <Avatar user={activeUser} size="sm" className="ring-2 ring-white shadow-md" />
              </button>
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 p-2 z-50 min-w-[12rem] animate-slide-up">
                    <div className="px-3 py-2 mb-1 border-b border-slate-100">
                      <p className="font-bold text-sm text-slate-800">{activeUser?.name}</p>
                      <p className="text-[10px] font-medium text-slate-400">{activeUser?.role}</p>
                    </div>
                    <button onClick={() => { setIsUserSwitcherOpen(true); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-600 hover:bg-slate-50 transition-colors">
                      <ArrowLeftRight className="w-4 h-4" /><span className="text-sm font-semibold">Switch Profile</span>
                    </button>
                    <button onClick={() => { setActiveTab('settings'); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-600 hover:bg-slate-50 transition-colors">
                      <Settings className="w-4 h-4" /><span className="text-sm font-semibold">Settings</span>
                    </button>
                    <button onClick={() => { setIsNotifModalOpen(true); markNotifsAsRead(); setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-600 hover:bg-slate-50 transition-colors">
                      <BellRing className="w-4 h-4" /><span className="text-sm font-semibold">Notifications</span>
                      {unreadNotifsCount > 0 && <span className="ml-auto w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadNotifsCount}</span>}
                    </button>
                    <button onClick={() => { setIsProfileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-600 hover:bg-slate-50 transition-colors">
                      <HelpCircle className="w-4 h-4" /><span className="text-sm font-semibold">Help</span>
                    </button>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button onClick={() => { setIsProfileMenuOpen(false); setIsLoggedIn(false); setActiveUser(null); try { localStorage.removeItem('kinflow_lastProfile'); localStorage.removeItem('kinflow_loggedIn'); } catch(e) {} }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-rose-500 hover:bg-rose-50 transition-colors">
                        <LogOut className="w-4 h-4" /><span className="text-sm font-semibold">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto scroll-container" style={{minHeight:0}}>
          <div className="px-4 pt-3 pb-36 max-w-lg mx-auto w-full">
            {renderContent()}
          </div>
        </div>

        {/* Global Notifications Modal */}
        <Modal isOpen={isNotifModalOpen} onClose={() => setIsNotifModalOpen(false)} title="Notifications" fullHeight>
          <div className="space-y-3">
            {myNotifications.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No new notifications!</p>
              </div>
            ) : (
              myNotifications.map(n => (
                <div key={n.id} className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex gap-4">
                  <div className="bg-white p-2 rounded-full shadow-sm shrink-0 h-fit">
                    <BellRing className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">{n.body}</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2">
                      {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>

        {/* Global Confirmation Modal */}
        <Modal isOpen={!!confirmActionState} onClose={() => setConfirmActionState(null)} title={confirmActionState?.title || "Confirm"}>
          <div className="space-y-4">
            <p className="text-slate-500 font-medium text-sm leading-relaxed">{confirmActionState?.message}</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmActionState(null)} className="spring-press flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={confirmActionState?.onConfirm} className="spring-press flex-1 py-3.5 rounded-2xl font-bold text-sm bg-rose-500 text-white shadow-md shadow-rose-500/25">Delete</button>
            </div>
          </div>
        </Modal>

        <AICopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />

        <Modal isOpen={isUserSwitcherOpen} onClose={() => setIsUserSwitcherOpen(false)} title={isChild ? "Switch Child" : "Switch Profile"}>
          <div className="space-y-3">
            {MOCK_USERS.filter(u => isChild ? u.role === 'Child' : true).map(user => (
              <div key={user.id} onClick={() => { setActiveUser(user); try { localStorage.setItem('kinflow_lastProfile', JSON.stringify(user)); } catch(e) {} setIsUserSwitcherOpen(false); }} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${activeUser?.id === user.id ? 'bg-slate-100 ring-2 ring-slate-400' : 'bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-900/5'}`}>
                <Avatar user={user} size="md" />
                <div><h4 className="font-bold text-slate-800">{user.name}</h4><p className="text-xs font-medium text-slate-500">{user.role}</p></div>
                {activeUser?.id === user.id && <Check className="w-5 h-5 text-slate-800 ml-auto" />}
              </div>
            ))}
            {isChild && (
              <button onClick={() => { setActiveUser(null); setIsUserSwitcherOpen(false); try { localStorage.removeItem('kinflow_lastProfile'); } catch(e) {} }} className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-slate-300 hover:text-slate-600 transition-colors mt-2">
                Back to Profile Select
              </button>
            )}
          </div>
        </Modal>

        {/* PREMIUM BOTTOM NAV */}
        <div className="fixed bottom-0 inset-x-0 z-40" style={{paddingBottom:'env(safe-area-inset-bottom, 0px)'}}>
          <div className="mx-4 mb-4">
            <nav className={`${isChild ? 'bg-white ring-1 ring-black/5' : 'bg-white/95 backdrop-blur-2xl ring-1 ring-black/5'} rounded-[2rem] shadow-[0_-2px_40px_rgba(0,0,0,0.12)] flex items-center px-2 py-1 relative`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <NavItem
                    key={item.id}
                    icon={Icon}
                    label={item.label}
                    isActive={isActive}
                    isChild={isChild}
                    onClick={() => { setActiveTab(item.id); setMoreMenuOpen(false); }}
                  />
                );
              })}
              {moreNavItems.length > 0 && (
                <div className="relative flex-1 flex justify-center">
                  <button
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    className={`spring-press flex flex-col items-center justify-center w-full py-2 rounded-2xl transition-all ${moreMenuOpen ? 'text-indigo-600' : 'text-slate-400'}`}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                    <span className="text-[9px] font-bold mt-0.5">More</span>
                  </button>
                  {moreMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMoreMenuOpen(false)} />
                      <div className="absolute bottom-full mb-3 right-0 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 p-2 z-50 min-w-[10rem] animate-slide-up">
                        {moreNavItems.map((item) => {
                          const MIcon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => { setActiveTab(item.id); setMoreMenuOpen(false); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <MIcon className="w-4 h-4" />
                              <span className="text-sm font-semibold">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <FamilyProvider>
      <AppInner />
    </FamilyProvider>
  );
}
