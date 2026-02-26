import React, { useState, useRef, useEffect } from 'react';
import { Send, Wand2, Loader2 } from 'lucide-react';
import { Modal } from '../shared/Primitives';
import { fetchWithRetry } from '../../utils/firebase';

export const AICopilotModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([{ role: 'ai', text: "Hi! I'm your Kinflow Copilot. I can help organize chores, plan meals, or resolve scheduling conflicts. What's up?" }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen, isLoading]);

  const handleSend = async (presetText = null) => {
    const textToSend = presetText || input;
    if (!textToSend.trim() || isLoading) return;
    
    const newMessages = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = ""; 
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      const geminiMessages = newMessages.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const payload = {
        systemInstruction: { parts: [{ text: "You are Kinflow Copilot, a helpful AI assistant for a family organization app. Help parents plan meals, suggest age-appropriate chores, manage schedules, and give brief, friendly, practical advice. Keep your responses concise (under 3 sentences) and use emojis occasionally." }] },
        contents: geminiMessages
      };

      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that right now.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Oops, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Copilot" fullHeight>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-700">Kinflow Copilot</span>
            <p className="text-[10px] text-indigo-400 font-medium">Powered by Gemini AI</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 mb-1">
                  <Wand2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[82%] px-4 py-3 text-sm font-medium leading-relaxed shadow-sm
                ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-3xl rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-3xl rounded-bl-md ring-1 ring-black/5'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0">
                <Wand2 className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-3 rounded-3xl rounded-bl-md bg-slate-100 ring-1 ring-black/5 flex items-center gap-2 text-sm font-medium text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {messages.length < 3 && !isLoading && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 pt-1 shrink-0">
            {["Plan Dinners", "Assign Chores", "Find Free Time"].map(action => (
              <button key={action} onClick={() => handleSend(action)} className="spring-press whitespace-nowrap bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
                {action}
              </button>
            ))}
          </div>
        )}
        <div className="relative mt-auto shrink-0 pt-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} disabled={isLoading} placeholder={isLoading ? "Copilot is thinking..." : "Ask Copilot anything..."} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-2xl pl-5 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all font-medium disabled:opacity-50" />
          <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="spring-press absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl transition-all disabled:opacity-50 shadow-md shadow-indigo-500/25">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

