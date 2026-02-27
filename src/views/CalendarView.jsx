import React, { useState, useContext } from 'react';
import { Plus, Clock, MapPin, ChevronLeft, ChevronRight, Trash2, Calendar as CalendarIcon, Rows3, CalendarDays } from 'lucide-react';
import { ThemeContext } from '../contexts/FamilyContext';
import { Card, Button, Modal, RevealCard, DetailActions } from '../components/shared/Primitives';

export const CalendarView = ({ events, onAdd, onUpdate, onDelete, isParent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');
  const [swipedEventId, setSwipedEventId] = useState(null);
  const [deletedEvent, setDeletedEvent] = useState(null);

  const startOfWeek = new Date(baseDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(d);
  }

  const moveWeek = (offset) => {
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + offset * 7);
    setBaseDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, time: time || 'TBD', location: location || 'Home' });
    setTitle('');
    setTime('');
    setLocation('');
    setIsModalOpen(false);
  };

  const openEvent = (event) => { setSelectedEvent(event); setEditEvent({ ...event }); };

  const handleTouchStart = (e, eventId) => {
    e.currentTarget.dataset.touchStartX = String(e.changedTouches[0].clientX);
    e.currentTarget.dataset.eventId = String(eventId);
  };

  const handleTouchEnd = (e) => {
    const delta = Number(e.currentTarget.dataset.touchStartX || 0) - e.changedTouches[0].clientX;
    if (delta > 40 && isParent) setSwipedEventId(Number(e.currentTarget.dataset.eventId));
    if (delta < -35) setSwipedEventId(null);
  };

  const deleteWithUndo = (event) => {
    onDelete(event.id);
    setDeletedEvent(event);
    setSwipedEventId(null);
    setTimeout(() => setDeletedEvent(null), 4500);
  };

  const undoDelete = () => {
    if (!deletedEvent) return;
    onAdd({ title: deletedEvent.title, time: deletedEvent.time, location: deletedEvent.location });
    setDeletedEvent(null);
  };

  return (
    <div className="space-y-5 animate-bounce-in" onClick={() => setSwipedEventId(null)}>
      <RevealCard delay={0}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule</h2>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => moveWeek(-1)} className="spring-press p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-xl shadow-sm ring-1 ring-black/5 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <p className="text-slate-500 font-bold text-xs tracking-widest uppercase">{weekDays[0].toLocaleString('en-US', { month: 'short' })} {weekDays[0].getFullYear()}</p>
              <button onClick={() => moveWeek(1)} className="spring-press p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-xl shadow-sm ring-1 ring-black/5 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-2xl p-1 ring-1 ring-black/5 flex">
              <button onClick={() => setViewMode('calendar')} className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${viewMode === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}><CalendarDays className="w-3.5 h-3.5"/>Cal</button>
              <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}><Rows3 className="w-3.5 h-3.5"/>List</button>
            </div>
            {isParent && (
              <button onClick={() => setIsModalOpen(true)} className="spring-press w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-900/20">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </RevealCard>

      {viewMode === 'calendar' && (<>
      {/* WEEK STRIP */}
      <RevealCard delay={60}>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1" style={{scrollSnapType:'x mandatory'}}>
          {weekDays.map((d, idx) => {
            const today = isToday(d);
            return (
              <div key={idx}
                onClick={() => setSelectedDay(d)}
                className="spring-press flex flex-col items-center justify-center min-w-[3.25rem] h-16 rounded-2xl transition-all cursor-pointer shrink-0"
                style={{scrollSnapAlign:'start', background: today ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : selectedDay && d.getDate()===selectedDay.getDate() && d.getMonth()===selectedDay.getMonth() ? 'linear-gradient(135deg, #e0e7ff, #ede9fe)' : 'white', boxShadow: today ? '0 4px 16px rgba(79,70,229,0.3)' : selectedDay && d.getDate()===selectedDay.getDate() ? '0 2px 8px rgba(79,70,229,0.15)' : '0 1px 4px rgba(0,0,0,0.06)', border:'1px solid ' + (today ? 'transparent' : selectedDay && d.getDate()===selectedDay.getDate() && d.getMonth()===selectedDay.getMonth() ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.05)')}}
              >
                <span className={`text-[9px] font-bold uppercase tracking-widest ${today ? 'text-white/70' : selectedDay && d.getDate()===selectedDay.getDate() && d.getMonth()===selectedDay.getMonth() ? 'text-indigo-500' : 'text-slate-400'}`}>{d.toLocaleString('en-US',{weekday:'short'})}</span>
                <span className={`text-xl font-bold mt-0.5 ${today ? 'text-white' : selectedDay && d.getDate()===selectedDay.getDate() && d.getMonth()===selectedDay.getMonth() ? 'text-indigo-600' : 'text-slate-800'}`}>{d.getDate()}</span>
              </div>
            );
          })}
        </div>
      </RevealCard>

      {/* DAY DRAWER - shows when a day is tapped */}
      {selectedDay && (
        <RevealCard delay={80}>
          <div className="bg-white rounded-[1.75rem] ring-1 ring-black/5 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  {selectedDay.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <h3 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
                  {selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h3>
              </div>
              {isParent && (
                <button onClick={() => setIsModalOpen(true)} className="spring-press flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Event
                </button>
              )}
            </div>
            <div className="p-3">
              {events.filter(e => {
                /* show all events for now - real app would filter by date */
                return true;
              }).length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-sky-100 rounded-[1.75rem] flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-7 h-7 text-sky-400" />
                  </div>
                  <p className="text-slate-700 font-bold text-base">Nothing planned</p>
                  <p className="text-slate-400 text-xs font-medium mt-1">This day is wide open 🌤️</p>
                  {isParent && <button onClick={() => setIsModalOpen(true)} className="mt-4 px-5 py-2.5 bg-sky-500 text-white text-xs font-bold rounded-xl hover:bg-sky-600 transition-colors">Add Event</button>}
                </div>
              ) : (
                <div className="space-y-2">
                  {events?.map((event, idx) => (
                    <div key={event.id} onClick={() => openEvent(event)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div className={`w-1 h-10 rounded-full shrink-0 ${event.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm">{event.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {event.time}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3"/> {event.location}</span>
                        </div>
                      </div>
                      {isParent && (
                        <button onClick={() => onDelete(event.id)} className="p-1.5 text-slate-200 hover:text-rose-500 rounded-xl transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </RevealCard>
      )}

      </>)}

      {/* ALL EVENTS (when no day selected) */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {events.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[1.75rem] ring-1 ring-black/5">
              <div className="w-14 h-14 bg-violet-100 rounded-[1.75rem] flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-7 h-7 text-violet-400" />
              </div>
              <p className="text-slate-700 font-bold text-base">No events yet</p>
              <p className="text-slate-400 text-xs font-medium mt-1 max-w-[200px] mx-auto">Add your family's events to keep everyone in sync</p>
              {isParent && <button onClick={() => setIsModalOpen(true)} className="mt-4 px-5 py-2.5 bg-violet-500 text-white text-xs font-bold rounded-xl hover:bg-violet-600 transition-colors">Add First Event</button>}
            </div>
          )}
          {events?.map((event, idx) => (
            <RevealCard key={event.id} delay={idx * 60}>
              <div onClick={() => openEvent(event)} onTouchStart={(e) => handleTouchStart(e, event.id)} onTouchEnd={handleTouchEnd} className="bg-white rounded-[1.75rem] p-4 shadow-sm ring-1 ring-black/5 flex items-center gap-4 cursor-pointer">
                <div className={`w-1 h-14 rounded-full shrink-0 ${event.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {event.time}</span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3"/> {event.location}</span>
                  </div>
                </div>
                {isParent && swipedEventId === event.id && (
                  <button onClick={() => deleteWithUndo(event)} className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </RevealCard>
          ))}
        </div>
      )}


      {deletedEvent && (
        <div className="fixed left-4 right-4 bottom-28 z-40 bg-slate-900 text-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
          <span className="text-sm font-semibold truncate">Event deleted</span>
          <button onClick={undoDelete} className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-xl">Undo</button>
        </div>
      )}

      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Event Details">
        {selectedEvent && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event</p>
              <p className="font-bold text-slate-900 text-lg">{selectedEvent.title}</p>
              <p className="text-xs text-slate-500 font-semibold mt-2">{selectedEvent.time} · {selectedEvent.location}</p>
            </div>
            {isParent ? (
              <form onSubmit={(e) => { e.preventDefault(); onUpdate(editEvent); setSelectedEvent(editEvent); }} className="space-y-3">
                <input value={editEvent.title} onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={editEvent.time || ''} onChange={(e) => setEditEvent({ ...editEvent, time: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium" />
                  <input value={editEvent.location || ''} onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium" />
                </div>
                <DetailActions
                  onClose={() => setSelectedEvent(null)}
                  onSave={() => { onUpdate(editEvent); setSelectedEvent(editEvent); }}
                  onDelete={() => { onDelete(selectedEvent.id); setSelectedEvent(null); }}
                />
              </form>
            ) : (
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Event">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Event Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium transition-all" placeholder="e.g., Dentist Appointment" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Time</label>
              <input type="text" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium" placeholder="e.g., 2:00 PM" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium" placeholder="e.g., Clinic" />
            </div>
          </div>
          <button type="submit" className="spring-press w-full py-4 rounded-2xl font-bold text-base bg-slate-900 text-white shadow-md shadow-slate-900/20 mt-2">Add Event</button>
        </form>
      </Modal>
    </div>
  );
};

