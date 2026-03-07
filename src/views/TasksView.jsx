import React, { useState, useContext, useRef } from 'react';
import { Plus, Check, Clock, Star, Hourglass, Trash2, Camera, ChevronRight, X, MoreVertical, User, CheckSquare, Loader2 } from 'lucide-react';
import { ThemeContext, useFamilyContext } from '../contexts/FamilyContext';
import { Card, Button, Badge, Avatar, Modal, RevealCard, DetailActions, AgentSuggestionCard } from '../components/shared/Primitives';

export const TasksView = ({ tasks, onAction, onAdd, onUpdate, onDelete, activeUser, isParent }) => {
  const { familyMembers, agentSuggestions, approveAgentSuggestion } = useFamilyContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(() => {
    // Default to first child, or first member
    const firstChild = familyMembers.find(u => u.role === 'Child');
    return firstChild ? firstChild.name : (familyMembers[0]?.name || 'Anyone');
  });
  const [taskPoints, setTaskPoints] = useState(10);
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [dueDate, setDueDate] = useState('');

  const { isChild } = useContext(ThemeContext);

  const [activeTaskForPhoto, setActiveTaskForPhoto] = useState(null); 
  const [mockPhotoCaptured, setMockPhotoCaptured] = useState(null);
  const [activeTaskForReview, setActiveTaskForReview] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null); 
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState(null);
  
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [swipedTaskId, setSwipedTaskId] = useState(null);
  const [recentlyDeletedTask, setRecentlyDeletedTask] = useState(null);

  const visibleTasks = isParent ? tasks : tasks.filter(t => t.assignee === activeUser?.name || t.assignee === 'Anyone');

  const handleSubmitNewTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, assignee, points: parseInt(taskPoints), requiresPhoto, dueDate: dueDate || null });
    setTitle('');
    setRequiresPhoto(false);
    setDueDate('');
    setIsModalOpen(false);
  };

  const handleTaskClick = (task) => {
    if (isParent) {
      if (task.status === 'pending') {
        setActiveTaskForReview(task);
      } else {
        setSelectedTask(task);
        setTaskForm({ ...task });
      }
    } else {
      if (task.status === 'open' && task.requiresPhoto) {
        setActiveTaskForPhoto(task);
        setMockPhotoCaptured(null);
      } else {
        setSelectedTask(task);
      }
    }
  };

  const handleCaptureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; 
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setMockPhotoCaptured(dataUrl);
        setIsUploading(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPhoto = () => {
    onAction(activeTaskForPhoto.id, 'submit_with_photo', { photoUrl: mockPhotoCaptured });
    setActiveTaskForPhoto(null);
  };

  const handleTouchStart = (e, taskId) => {
    const startX = e.changedTouches[0].clientX;
    e.currentTarget.dataset.touchStartX = String(startX);
    e.currentTarget.dataset.taskId = String(taskId);
  };

  const handleTouchEnd = (e) => {
    const startX = Number(e.currentTarget.dataset.touchStartX || 0);
    const endX = e.changedTouches[0].clientX;
    const delta = startX - endX;
    if (delta > 45 && isParent) {
      setSwipedTaskId(Number(e.currentTarget.dataset.taskId));
    }
    if (delta < -35) setSwipedTaskId(null);
  };

  const handleDeleteWithUndo = (task) => {
    onDelete(task.id);
    setSwipedTaskId(null);
    setRecentlyDeletedTask(task);
    setTimeout(() => setRecentlyDeletedTask(null), 4500);
  };

  const handleUndoDelete = () => {
    if (!recentlyDeletedTask) return;
    onAdd({
      title: recentlyDeletedTask.title,
      assignee: recentlyDeletedTask.assignee,
      points: recentlyDeletedTask.points,
      requiresPhoto: recentlyDeletedTask.requiresPhoto,
      dueDate: recentlyDeletedTask.dueDate || null,
    });
    setRecentlyDeletedTask(null);
  };

  return (
    <div className="space-y-5 animate-bounce-in" onClick={() => setSwipedTaskId(null)}>
      <RevealCard delay={0}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{isParent ? 'Family Tasks' : 'My Chores'}</h2>
            <p className="text-slate-400 font-medium text-sm mt-0.5">Check off to earn points!</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{visibleTasks.filter(t=>t.status==='open').length} open</span>
            {isParent && (
              <button onClick={() => setIsModalOpen(true)} className="spring-press w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-900/20">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </RevealCard>

      {agentSuggestions?.tasks?.length > 0 && (
        <div className="space-y-2">
          {agentSuggestions.tasks.slice(0, 3).map((suggestion) => (
            <AgentSuggestionCard
              key={suggestion.id}
              icon="✅"
              title={suggestion.title}
              subtitle={suggestion.subtitle}
              confidence={suggestion.confidence}
              onApprove={() => approveAgentSuggestion(suggestion, true)}
              onDismiss={() => approveAgentSuggestion(suggestion, false)}
            />
          ))}
        </div>
      )}

      {/* APPROVAL QUEUE (parents only) */}
      {isParent && visibleTasks.filter(t => t.status === 'pending').length > 0 && (
        <RevealCard delay={40}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-amber-400 rounded-xl flex items-center justify-center">
                <Hourglass className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Needs Your Approval</h3>
              <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">{visibleTasks.filter(t => t.status === 'pending').length}</span>
            </div>
            <div className="space-y-2">
              {visibleTasks.filter(t => t.status === 'pending').map((task, idx) => {
                return (
                  <div key={task.id} onClick={() => handleTaskClick(task)} className="spring-press bg-amber-50 rounded-2xl p-4 ring-1 ring-amber-200 flex items-center gap-3 cursor-pointer transition-all hover:ring-amber-300">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-amber-400 border-2 border-amber-400">
                      <Hourglass className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight text-slate-800">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3"/>{task.assignee}</span>
                        {task.requiresPhoto && task.photoUrl && <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Camera className="w-3 h-3"/>Has Photo</span>}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold bg-amber-400 text-white px-3 py-1.5 rounded-full shadow-sm">Review →</span>
                  </div>
                );
              })}
            </div>
          </div>
        </RevealCard>
      )}

      <div className="space-y-3">
        {visibleTasks.filter(t => isParent ? t.status !== 'pending' : true).length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl ring-1 ring-black/5">
            <div className="w-14 h-14 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-slate-700 font-bold text-base">{isParent ? 'All caught up!' : 'No tasks right now!'}</p>
            <p className="text-slate-400 text-xs font-medium mt-1 max-w-[200px] mx-auto">{isParent ? 'All tasks have been reviewed. Nice work!' : 'Check back later for new chores to earn points!'}</p>
            {isParent && <button onClick={() => setIsModalOpen(true)} className="mt-4 px-5 py-2.5 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors">Create Task</button>}
          </div>
        )}
        {visibleTasks.filter(t => isParent ? t.status !== 'pending' : true).map((task, idx) => {
          const isApproved = task.status === 'approved';
          const isPending = task.status === 'pending';

          return (
            <RevealCard key={task.id} delay={idx * 60}>
              <div
                onClick={() => handleTaskClick(task)}
                onTouchStart={(e) => handleTouchStart(e, task.id)}
                onTouchEnd={handleTouchEnd}
                className={`spring-press bg-white rounded-[1.75rem] p-4 shadow-sm ring-1 flex items-center gap-3 cursor-pointer transition-all
                  ${isApproved ? 'opacity-55 ring-black/5' : isPending ? 'ring-amber-200 bg-amber-50/30' : 'ring-black/5'}`}
              >
                {/* Left accent */}
                <div className={`w-1 h-12 rounded-full shrink-0 ${isApproved ? 'bg-emerald-400' : isPending ? 'bg-amber-400' : 'bg-slate-200'}`} />

                {/* Status circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                  ${isApproved ? 'bg-emerald-500 border-emerald-500' : isPending ? 'bg-amber-400 border-amber-400' : 'border-dashed border-slate-300'}`}>
                  {isApproved && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  {isPending && <Hourglass className="w-3.5 h-3.5 text-white" style={{animationDuration:'3s'}} />}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm leading-tight ${isApproved ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3"/>{task.assignee}</span>
                    {task.dueDate && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/>Due {task.dueDate}</span>}
                    {task.requiresPhoto && <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Camera className="w-3 h-3"/>Photo</span>}
                    {isPending && isChild && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending...</span>}
                    {task.feedback && !isApproved && !isPending && isChild && (
                      <div className="w-full mt-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-0.5">Parent Feedback</p>
                        <p className="text-xs text-rose-700 font-medium">{task.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Points + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPending && isParent && <span className="text-[9px] font-bold bg-amber-400 text-white px-2.5 py-1 rounded-full animate-pulse">Review</span>}
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isApproved ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'}`}>+{task.points}</span>
                  {isParent && swipedTaskId === task.id && (
                    <button onClick={e=>{e.stopPropagation();handleDeleteWithUndo(task);}} className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                </div>
              </div>
            </RevealCard>
          )
        })}
      </div>

      {recentlyDeletedTask && (
        <div className="fixed left-4 right-4 bottom-28 z-40 bg-slate-900 text-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
          <span className="text-sm font-semibold truncate">Task deleted</span>
          <button onClick={handleUndoDelete} className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-xl">Undo</button>
        </div>
      )}

      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Task Details">
        {selectedTask && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Task</p>
              <p className="font-bold text-slate-900 text-lg">{selectedTask.title}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Assigned to {selectedTask.assignee} · +{selectedTask.points} pts</p>
            </div>
            {isParent ? (
              <form onSubmit={(e) => { e.preventDefault(); onUpdate(taskForm); setSelectedTask(taskForm); }} className="space-y-3">
                <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={taskForm.assignee || ''} onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium" />
                  <input type="number" value={taskForm.points || 0} onChange={(e) => setTaskForm({ ...taskForm, points: parseInt(e.target.value || '0', 10) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium" />
                </div>
                <DetailActions
                  onClose={() => setSelectedTask(null)}
                  onSave={() => { onUpdate(taskForm); setSelectedTask(taskForm); }}
                  onDelete={() => { onDelete(selectedTask.id); setSelectedTask(null); }}
                />
              </form>
            ) : (
              <Button onClick={() => { onAction(selectedTask.id, 'toggle_simple'); setSelectedTask(null); }} variant="primary">Mark Progress</Button>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Task">
        <form onSubmit={handleSubmitNewTask} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Task Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 text-slate-800 font-medium transition-all" placeholder="e.g., Clean the garage" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assignee</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium">
                {familyMembers.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
                <option value="Anyone">Anyone</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Points</label>
              <select value={taskPoints} onChange={e => setTaskPoints(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium">
                <option value="5">5 pts</option><option value="10">10 pts</option><option value="15">15 pts</option><option value="20">20 pts</option><option value="50">50 pts</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium transition-all" />
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
            <div>
              <h4 className="font-bold text-sm text-slate-700">Require Photo Proof</h4>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Child must snap a photo to finish.</p>
            </div>
            <div onClick={() => setRequiresPhoto(!requiresPhoto)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${requiresPhoto ? 'bg-indigo-500' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${requiresPhoto ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </div>

          <button type="submit" className="spring-press w-full py-4 rounded-2xl font-bold text-base bg-slate-900 text-white shadow-md shadow-slate-900/20 mt-2">Add Task</button>
        </form>
      </Modal>

      <Modal isOpen={!!activeTaskForPhoto} onClose={() => setActiveTaskForPhoto(null)} title="Submit Proof">
        {!mockPhotoCaptured ? (
          <div className="space-y-4">
            <div className="h-44 bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center border-4 border-dashed border-slate-300 mx-auto w-full max-w-sm transition-all">
              <Camera className="w-12 h-12 text-slate-400 mb-2" />
              <p className="font-bold text-sm text-slate-500">Frame your work clearly!</p>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
            />
            
            <Button variant="primary" onClick={handleCaptureClick} disabled={isUploading}>
              {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Snap Photo"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-48 bg-slate-900 rounded-[2rem] overflow-hidden relative shadow-inner mx-auto w-full max-w-sm">
              <img src={mockPhotoCaptured} className="w-full h-full object-cover" alt="Captured proof" />
              <div className="absolute top-3 right-3 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                <Check className="w-4 h-4" strokeWidth={3} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setMockPhotoCaptured(null)}>Retake</Button>
              <Button variant="primary" className="flex-1" onClick={handleSubmitPhoto}>Submit</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!activeTaskForReview} onClose={() => setActiveTaskForReview(null)} title="Review Work">
        {activeTaskForReview && (
          <div className="space-y-4">
            <p className="font-medium text-sm text-slate-600 text-center">
              {activeTaskForReview.assignee} submitted proof for <span className="font-bold text-slate-900">"{activeTaskForReview.title}"</span>
            </p>
            {activeTaskForReview.photoUrl ? (
              <div className="h-48 bg-slate-900 rounded-[1.5rem] overflow-hidden shadow-inner mx-auto w-full max-w-sm">
                <img src={activeTaskForReview.photoUrl} className="w-full h-full object-cover" alt="Submitted proof" />
              </div>
            ) : (
              <div className="h-24 bg-slate-100 rounded-[1.5rem] flex items-center justify-center">
                <p className="text-slate-400 text-sm font-medium">No photo submitted</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 !border-rose-200 !text-rose-600 hover:!bg-rose-50" onClick={() => { setShowRejectModal(activeTaskForReview); setActiveTaskForReview(null); setRejectFeedback(''); }}>Needs Work</Button>
              <Button variant="primary" className="flex-1 !bg-emerald-500 hover:!bg-emerald-600 shadow-emerald-500/30" onClick={() => { onAction(activeTaskForReview.id, 'approve'); setActiveTaskForReview(null); }}>Approve</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!showRejectModal} onClose={() => setShowRejectModal(null)} title="Send Feedback">
        {showRejectModal && (
          <div className="space-y-4">
            <p className="font-medium text-sm text-slate-600">
              Tell <span className="font-bold text-slate-900">{showRejectModal.assignee}</span> what needs to be fixed on <span className="font-bold">"{showRejectModal.title}"</span>:
            </p>
            <textarea
              value={rejectFeedback}
              onChange={e => setRejectFeedback(e.target.value)}
              placeholder="e.g., The dishes aren't fully dry yet — please dry and put away."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400/50 text-slate-800 font-medium min-h-[100px] transition-all"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowRejectModal(null)}>Cancel</Button>
              <Button variant="primary" className="flex-1 !bg-rose-500 hover:!bg-rose-600" onClick={() => {
                onAction(showRejectModal.id, 'reject', { feedback: rejectFeedback });
                setShowRejectModal(null);
              }}>Send & Reject</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
