import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Send, Image as ImageIcon, Trash2, Link2,
  ChevronDown, X, MessageCircle, CheckSquare,
} from 'lucide-react';
import { ThemeContext, useFamilyContext } from '../contexts/FamilyContext';
import { Card, Avatar, Modal, AgentSuggestionCard } from '../components/shared/Primitives';

export const ChatView = ({ messages, onSend, onDelete, tasks }) => {
  const { isChild, user } = useContext(ThemeContext);
  const { familyMembers, approveAgentSuggestion } = useFamilyContext();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const isParent = user?.role === 'Parent';
  const [chatChannel, setChatChannel] = useState('family');
  const [linkedTask, setLinkedTask] = useState(null);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);

  // Refs for popover containers — used to detect outside clicks
  const channelPickerRef = useRef(null);
  const linkPickerRef = useRef(null);

  const channels = [
    { id: 'family', label: 'Family Chat', icon: '👨‍👩‍👧‍👦', sub: 'Everyone in the family' },
    { id: 'parents', label: 'Parents Only', icon: '🔒', sub: 'Private parent channel', parentOnly: true },
    ...(isParent
      ? familyMembers
          .filter((u) => u.role === 'Child')
          .map((u) => ({ id: `dm-${u.id}`, label: `Chat with ${u.name}`, icon: u.avatar || '💬', sub: 'Direct message' }))
      : []),
    ...(!isParent
      ? familyMembers
          .filter((u) => u.role === 'Parent')
          .map((u) => ({ id: `dm-${u.id}`, label: `Chat with ${u.name}`, icon: u.avatar || '💬', sub: 'Direct message' }))
      : []),
  ].filter((c) => !c.parentOnly || isParent);

  const activeChannel = channels.find((c) => c.id === chatChannel) || channels[0];
  const linkableTasks = (tasks || []).filter((t) => t.status === 'open' || t.status === 'pending').slice(0, 8);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close both pickers when clicking outside their containers
  useEffect(() => {
    if (!showChannelPicker && !showLinkPicker) return;

    const handleOutsideClick = (e) => {
      const inChannel = channelPickerRef.current?.contains(e.target);
      const inLink = linkPickerRef.current?.contains(e.target);
      if (!inChannel) setShowChannelPicker(false);
      if (!inLink) setShowLinkPicker(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showChannelPicker, showLinkPicker]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    const prefix = linkedTask ? `[Re: ${linkedTask.title}] ` : '';
    onSend(prefix + text);
    setInput('');
    setLinkedTask(null);
  };

  return (
    <div className="flex flex-col animate-bounce-in" style={{ height: 'calc(100dvh - 200px)' }}>

      {/* Chat header */}
      <div className="mb-4 shrink-0">

        {/* Channel selector */}
        <div className="relative" ref={channelPickerRef}>
          <button
            onClick={() => {
              setShowChannelPicker((prev) => !prev);
              setShowLinkPicker(false);
            }}
            className="flex items-center gap-2 group"
          >
            <span className="text-lg">{activeChannel.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                {activeChannel.label}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-all ${
                    showChannelPicker ? 'rotate-180' : ''
                  }`}
                />
              </h2>
              <p className="text-[10px] font-semibold text-slate-400">{activeChannel.sub}</p>
            </div>
          </button>

          {/* Channel dropdown */}
          {showChannelPicker && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl ring-1 ring-black/10 p-2 z-50 animate-bounce-in">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => { setChatChannel(ch.id); setShowChannelPicker(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                    chatChannel === ch.id ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">{ch.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${chatChannel === ch.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {ch.label}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400">{ch.sub}</p>
                  </div>
                  {chatChannel === ch.id && <div className="ml-auto w-2 h-2 bg-indigo-500 rounded-full" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Participant chips */}
        <div className="flex items-center gap-1 mt-2">
          {familyMembers
            .filter(
              (u) =>
                chatChannel === 'family' ||
                (chatChannel === 'parents' && u.role === 'Parent') ||
                chatChannel.startsWith('dm-'),
            )
            .slice(0, 5)
            .map((u, i) => (
              <div key={u.id} className="relative" style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 5 - i }}>
                <Avatar user={u} size="sm" className="ring-2 ring-white" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-1 ring-white" />
              </div>
            ))}
          <span className="text-[10px] font-bold text-slate-400 ml-2">
            {chatChannel === 'family'
              ? `${familyMembers.length} members`
              : chatChannel === 'parents'
              ? 'Parents only'
              : 'Direct message'}
          </span>
        </div>

        {/* Linked task context */}
        {linkedTask && (
          <div className="mt-2 flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl ring-1 ring-indigo-200 animate-bounce-in">
            <Link2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-xs font-bold text-indigo-700 truncate">Re: {linkedTask.title}</span>
            <button
              onClick={() => setLinkedTask(null)}
              className="ml-auto text-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-pink-100 rounded-3xl flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-pink-400" />
              </div>
              <p className="text-slate-700 font-bold text-base">No messages yet</p>
              <p className="text-slate-400 text-sm font-medium mt-1 text-center max-w-[220px]">
                Start the conversation with your family!
              </p>
            </div>
          )}
          {messages?.map((msg, idx) => {
            const isMe = Boolean(user?.id) && msg.senderId === user.id;
            const sender = familyMembers.find((u) => u.id === msg.senderId);
            const senderName = isMe ? `${user?.name || 'You'} (You)` : (sender?.name || 'Kinflow');
            const senderRole = isMe ? (user?.role || 'Member') : (sender?.role || 'Agent');
            return (
              <div key={msg.id} className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && <Avatar user={sender} size="sm" className="shrink-0 mb-4 ring-2 ring-white shadow-sm" />}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[78%]`}>
                  <span className="text-[10px] font-bold text-slate-500 ml-2 mb-1 inline-flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full bg-gradient-to-br ${
                        sender?.color || user?.color || 'from-indigo-400 to-violet-500'
                      }`}
                    />
                    {senderName} · {senderRole}
                  </span>
                  <div
                    className={`px-4 py-2.5 text-sm font-medium leading-relaxed shadow-sm ${
                      isMe
                        ? isChild
                          ? 'bg-sky-500 text-white rounded-3xl rounded-br-md'
                          : 'bg-slate-900 text-white rounded-3xl rounded-br-md'
                        : 'bg-slate-100 text-slate-800 rounded-3xl rounded-bl-md ring-1 ring-black/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {Array.isArray(msg.suggestions) && msg.suggestions.length > 0 && (
                    <div className="mt-2 space-y-2 w-full max-w-sm">
                      {msg.suggestions.slice(0, 2).map((suggestion) => (
                        <AgentSuggestionCard
                          key={suggestion.id}
                          icon="🤖"
                          title={suggestion.title}
                          subtitle={suggestion.subtitle}
                          confidence={suggestion.confidence}
                          onApprove={() => approveAgentSuggestion(suggestion, true)}
                          onDismiss={() => approveAgentSuggestion(suggestion, false)}
                        />
                      ))}
                    </div>
                  )}
                  <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {isMe && <span className="text-[9px] font-bold text-slate-400">You · {user?.name}</span>}
                    {isMe && (
                      <button
                        onClick={() => onDelete(msg.id)}
                        className="text-slate-300 hover:text-rose-500 p-0.5 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <span className="text-[9px] font-bold text-slate-300">{msg.time}</span>
                    {!isMe && isParent && (
                      <button
                        onClick={() => onDelete(msg.id)}
                        className="text-slate-300 hover:text-rose-500 p-0.5 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies for kids */}
        {isChild && (
          <div className="px-3 pt-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {['👍', '❤️', 'Done!', 'Need help', 'Snack time?'].map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSend(reply)}
                  className="spring-press whitespace-nowrap bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-slate-100 p-3 flex items-center gap-2 shrink-0 bg-slate-50/50">
          {!isChild && (
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}

          {/* Link-to-task picker */}
          <div className="relative" ref={linkPickerRef}>
            <button
              onClick={() => {
                setShowLinkPicker((prev) => !prev);
                setShowChannelPicker(false);
              }}
              className={`p-2 transition-colors ${linkedTask ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Link2 className="w-4 h-4" />
            </button>
            {showLinkPicker && linkableTasks.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl shadow-xl ring-1 ring-black/10 p-2 z-50 animate-bounce-in max-h-48 overflow-y-auto">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5">
                  Link to task
                </p>
                {linkableTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setLinkedTask(t); setShowLinkPicker(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <CheckSquare className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate">{t.title}</span>
                    <span className="text-[9px] font-medium text-slate-400 shrink-0">{t.points}pt</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isChild ? 'Type a message...' : 'Message family...'}
            className="flex-1 bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all font-medium rounded-2xl pl-4 pr-4 py-2.5 text-sm"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className={`spring-press p-2.5 text-white rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center ${
              isChild ? 'bg-sky-500' : 'bg-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
