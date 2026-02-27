import React, { useMemo, useState } from 'react';
import { Plus, Clock, MapPin, ChevronLeft, ChevronRight, Trash2, CalendarDays, Rows3 } from 'lucide-react';
import { Button, Modal, RevealCard, DetailActions } from '../components/shared/Primitives';

export const CalendarView = ({ events, onAdd, onUpdate, onDelete, isParent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');
  const [swipedEventId, setSwipedEventId] = useState(null);
  const [deletedEvent, setDeletedEvent] = useState(null);

  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [monthDate]);

  const isSameDate = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const parseEventDate = (event) => {
    if (event.date) return new Date(event.date);
    return new Date();
  };

  const selectedDayEvents = useMemo(() => {
    return (events || []).filter((event) => isSameDate(parseEventDate(event), selectedDay));
  }, [events, selectedDay]);

  const sortedEvents = useMemo(() => {
    return [...(events || [])].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [events]);

  const moveMonth = (offset) => {
    const next = new Date(monthDate);
    next.setMonth(monthDate.getMonth() + offset);
    setMonthDate(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title,
      time: time || 'TBD',
      location: location || 'Home',
      date: selectedDay.toISOString(),
    });
    setTitle('');
    setTime('');
    setLocation('');
    setIsModalOpen(false);
  };

  const openEvent = (event) => {
    setSelectedEvent(event);
    setEditEvent({ ...event });
    setViewMode('list');
  };

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
    onAdd({ title: deletedEvent.title, time: deletedEvent.time, location: deletedEvent.location, date: deletedEvent.date || new Date().toISOString() });
    setDeletedEvent(null);
  };

  return (
    <div className="space-y-5 animate-bounce-in" onClick={() => setSwipedEventId(null)}>
      <RevealCard delay={0}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule</h2>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => moveMonth(-1)} className="spring-press p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-xl shadow-sm ring-1 ring-black/5 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <p className="text-slate-500 font-bold text-xs tracking-widest uppercase">{monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
              <button onClick={() => moveMonth(1)} className="spring-press p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-xl shadow-sm ring-1 ring-black/5 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-2xl p-1 ring-1 ring-black/5 flex">
              <button onClick={() => setViewMode('calendar')} className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${viewMode === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}><CalendarDays className="w-3.5 h-3.5" />Cal</button>
              <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}><Rows3 className="w-3.5 h-3.5" />List</button>
            </div>
            {isParent && (
              <button onClick={() => setIsModalOpen(true)} className="spring-press w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-900/20">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </RevealCard>

      {viewMode === 'calendar' && (
        <RevealCard delay={40}>
          <div className="bg-white rounded-[1.75rem] ring-1 ring-black/5 p-4 shadow-sm">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((d, idx) => {
                const inMonth = d.getMonth() === monthDate.getMonth();
                const isSelected = isSameDate(d, selectedDay);
                const hasEvents = (events || []).some((ev) => isSameDate(parseEventDate(ev), d));
                const today = isSameDate(d, new Date());
                return (
                  <button
                    key={`${d.toISOString()}-${idx}`}
                    onClick={() => {
                      setSelectedDay(d);
                      setViewMode('list');
                    }}
                    className={`h-12 rounded-2xl text-sm font-bold relative transition-all ${isSelected ? 'bg-slate-900 text-white' : inMonth ? 'bg-slate-50 text-slate-700' : 'bg-slate-50/60 text-slate-300'} ${today && !isSelected ? 'ring-2 ring-indigo-300' : 'ring-1 ring-black/5'}`}
                  >
                    {d.getDate()}
                    {hasEvents && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </RevealCard>
      )}

      {viewMode === 'list' && (
        <div className="space-y-3">
          {(selectedDayEvents.length ? selectedDayEvents : sortedEvents).map((event, idx) => (
            <RevealCard key={event.id} delay={idx * 40}>
              <div
                onClick={() => openEvent(event)}
                onTouchStart={(e) => handleTouchStart(e, event.id)}
                onTouchEnd={handleTouchEnd}
                className="bg-white rounded-[1.75rem] p-4 shadow-sm ring-1 ring-black/5 flex items-center gap-4 cursor-pointer"
              >
                <div className={`w-1 h-14 rounded-full shrink-0 ${event.color || 'bg-indigo-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
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
          {(selectedDayEvents.length ? selectedDayEvents : sortedEvents).length === 0 && (
            <div className="text-center py-12 bg-white rounded-[1.75rem] ring-1 ring-black/5">
              <p className="text-slate-700 font-bold text-base">No events found</p>
              <p className="text-slate-400 text-xs font-medium mt-1">Pick a date in calendar view or add a new event.</p>
            </div>
          )}
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
