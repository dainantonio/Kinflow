import React, { useState, useContext } from 'react';
import { Plus, ChefHat, Clock, Utensils, ShoppingCart, Trash2, Check, X, ChevronRight, Loader2 } from 'lucide-react';
import { ThemeContext, useFamilyContext } from '../contexts/FamilyContext';
import { Card, Button, Badge, Modal, RevealCard, DetailActions, AgentSuggestionCard } from '../components/shared/Primitives';

export const MealsView = ({ meals, onAdd, onUpdate, onDelete, isParent, groceries, setGroceries }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [addedConfirm, setAddedConfirm] = useState(null);
  const [servings, setServings] = useState(4);
  
  const [meal, setMeal] = useState('');
  const [day, setDay] = useState('Today');
  const [prepTime, setPrepTime] = useState('30m');
  const [newIngredients, setNewIngredients] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [manualGroceryItem, setManualGroceryItem] = useState('');
  const { familyMembers, handleSendMessage, activeUser, agentSuggestions, approveAgentSuggestion } = useFamilyContext();

  const handleAddSubmit = (e) => { e.preventDefault(); if (!meal.trim()) return; onAdd({ meal, day, prepTime: prepTime + ' prep', ingredients: newIngredients.trim(), instructions: newInstructions.trim() }); setMeal(''); setNewIngredients(''); setNewInstructions(''); setIsModalOpen(false); };
  const handleEditClick = () => { setEditForm({ ...selectedMeal }); setIsEditing(true); };
  const handleEditSubmit = (e) => { e.preventDefault(); if (!editForm.meal.trim()) return; onUpdate(editForm); setSelectedMeal(editForm); setIsEditing(false); };
  const closeMealModal = () => { setSelectedMeal(null); setIsEditing(false); setSelectedIngredients([]); setAddedConfirm(null); setServings(4); };

  const parseIngredientLine = (line) => {
    const cleaned = line.trim().replace(/^[-•]\s*/, '');
    const match = cleaned.match(/^((?:\d+[\/\d\.]*)(?:\s*[a-zA-Z]+)?)\s+(.+)$/);
    if (!match) return { quantity: '', name: cleaned.toLowerCase() };
    return { quantity: match[1].trim(), name: match[2].trim().toLowerCase() };
  };

  const scaleQuantity = (qty, fromServings, toServings) => {
    if (!qty) return '';
    const num = parseFloat(qty);
    if (Number.isNaN(num)) return qty;
    return `${(num * (toServings / fromServings)).toFixed(2).replace(/\.00$/, '')}`;
  };

  const generateGroceries = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const allIngredients = meals.reduce((acc, meal) => {
        if (meal.ingredients) return [...acc, ...meal.ingredients.split('\n').filter(i => i.trim())];
        return acc;
      }, []);
      const uniqueItems = [...new Set(allIngredients)].map((item, i) => ({ id: i, name: item, checked: false }));
      setGroceries(uniqueItems);
      setIsGenerating(false);
    }, 800);
  };

  const toggleGrocery = (id) => setGroceries(groceries.map(g => g.id === id ? { ...g, checked: !g.checked } : g));
  const openGroceryList = () => { if (groceries.length === 0) generateGroceries(); setIsGroceryModalOpen(true); };

  const addManualGroceryItem = () => {
    const item = manualGroceryItem.trim();
    if (!item) return;
    const exists = groceries.some((g) => g.name.toLowerCase() === item.toLowerCase());
    if (!exists) setGroceries((prev) => [...prev, { id: Date.now(), name: item, checked: false }]);
    setManualGroceryItem('');
  };

  const shareGroceryWithCoParent = () => {
    if (!isParent || !activeUser) return;
    const parentNames = familyMembers.filter((m) => m.role === 'Parent' && m.id !== activeUser.id).map((m) => m.name);
    const pendingItems = groceries.filter((g) => !g.checked).slice(0, 8).map((g) => g.name);
    if (pendingItems.length === 0) return;
    const target = parentNames.length > 0 ? ` for ${parentNames.join(', ')}` : '';
    handleSendMessage(`🛒 Grocery sync${target}: ${pendingItems.join(', ')}`);
  };

  return (
    <div className="space-y-5 animate-bounce-in">
      <RevealCard delay={0}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Meal Plan</h2>
            <p className="text-slate-400 font-medium text-sm mt-0.5">What's cooking this week?</p>
          </div>
          <div className="flex gap-2">
            <button onClick={openGroceryList} className="spring-press w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-sm ring-1 ring-black/5">
              <ShoppingCart className="w-4 h-4" strokeWidth={2} />
            </button>
            {isParent && (
              <button onClick={() => setIsModalOpen(true)} className="spring-press w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-900/20">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </RevealCard>

      {agentSuggestions?.meals?.length > 0 && (
        <div className="space-y-2">
          {agentSuggestions.meals.slice(0, 3).map((suggestion) => (
            <AgentSuggestionCard
              key={suggestion.id}
              icon="🍽️"
              title={suggestion.title}
              subtitle={suggestion.subtitle}
              confidence={suggestion.confidence}
              approveLabel="Add meal"
              onApprove={() => approveAgentSuggestion(suggestion, true)}
              onDismiss={() => approveAgentSuggestion(suggestion, false)}
            />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {meals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-[1.75rem] ring-1 ring-black/5">
            <div className="w-14 h-14 bg-orange-100 rounded-[1.75rem] flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-7 h-7 text-orange-400" />
            </div>
            <p className="text-slate-700 font-bold text-base">No meals planned</p>
            <p className="text-slate-400 text-xs font-medium mt-1 max-w-[200px] mx-auto">Plan your family's meals for the week ahead</p>
            {isParent && <button onClick={() => setIsModalOpen(true)} className="mt-4 px-5 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors">Plan First Meal</button>}
          </div>
        )}
        {meals?.map((meal, idx) => (
          <RevealCard key={meal.id} delay={idx * 60}>
            <div onClick={() => setSelectedMeal(meal)} className="spring-press bg-white rounded-[1.75rem] overflow-hidden shadow-md ring-1 ring-slate-900/6 cursor-pointer group transition-all active:scale-[0.98]">
              {/* Gradient banner */}
              <div className="h-20 relative flex items-center justify-center" style={{background:'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)'}}>
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'16px 16px'}} />
                <Utensils className="w-8 h-8 text-white/80" strokeWidth={1.5} />
                <div className="absolute top-3 left-3">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${meal.day === 'Today' ? 'bg-white text-orange-600' : 'bg-white/20 text-white'}`}>{meal.day}</span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-white" />
                  <span className="text-white text-[9px] font-bold">{meal.prepTime}</span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-slate-800 text-base leading-tight">{meal.meal}</h4>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {(meal.tags || []).map(tag => <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase tracking-wider">{tag}</span>)}
                </div>
              </div>
            </div>
          </RevealCard>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Recipe">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recipe Name</label>
            <input type="text" value={meal} onChange={e => setMeal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium" placeholder="e.g., Chicken Parmesan" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Day</label>
              <select value={day} onChange={e => setDay(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium"><option>Today</option><option>Tomorrow</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option></select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prep Time</label>
              <select value={prepTime} onChange={e => setPrepTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium"><option value="10m">10 mins</option><option value="15m">15 mins</option><option value="20m">20 mins</option><option value="30m">30 mins</option><option value="45m">45 mins</option><option value="1h">1 hour</option><option value="1h+">1+ hours</option></select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ingredients (one per line)</label>
            <textarea value={newIngredients} onChange={e => setNewIngredients(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium min-h-[80px] text-sm" placeholder="1 lb chicken breast&#10;2 cups rice&#10;1 tbsp olive oil" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Instructions (one step per line)</label>
            <textarea value={newInstructions} onChange={e => setNewInstructions(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 font-medium min-h-[80px] text-sm" placeholder="1. Preheat oven to 375°F&#10;2. Season chicken&#10;3. Bake for 25 minutes" />
          </div>
          <button type="submit" className="spring-press w-full py-4 rounded-2xl font-bold text-base bg-slate-900 text-white shadow-md shadow-slate-900/20 mt-2">Save Recipe</button>
        </form>
      </Modal>

      <Modal isOpen={!!selectedMeal} onClose={closeMealModal} title={isEditing ? "Edit Recipe" : (selectedMeal?.meal || "Recipe")}>
        {selectedMeal && !isEditing && (
          <div className="space-y-6">
            <div className="flex gap-2"><Badge variant="premium">{selectedMeal.day}</Badge><Badge variant="default">{selectedMeal.prepTime}</Badge></div>
            <div className="bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-900/5">
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Utensils className="w-4 h-4"/> Ingredients</h4>
              <div className="space-y-2">
                {(selectedMeal.ingredients || "").split('\n').filter(i => i.trim()).map((item, i) => {
                  const parsed = parseIngredientLine(item);
                  const scaledQty = scaleQuantity(parsed.quantity, 4, servings);
                  const ingredientLabel = `${scaledQty ? `${scaledQty} ` : ''}${parsed.name}`.trim();
                  const isSelected = selectedIngredients.includes(parsed.name);
                  return (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 hover:border-slate-300'}`} onClick={() => {
                      const trimmed = parsed.name;
                      setSelectedIngredients(prev => prev.includes(trimmed) ? prev.filter(x => x !== trimmed) : [...prev, trimmed]);
                    }}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-slate-700 font-medium flex-1">{ingredientLabel}</span>
                      <ShoppingCart className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-emerald-500' : 'text-slate-300'}`} />
                    </div>
                  );
                })}
              </div>
              {(selectedMeal.ingredients || "").split('\n').filter(i => i.trim()).length > 0 && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => {
                    const allItems = (selectedMeal.ingredients || "").split('\n').filter(i => i.trim()).map(i => parseIngredientLine(i).name);
                    setSelectedIngredients(prev => prev.length === allItems.length ? [] : allItems);
                  }} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors">
                    {selectedIngredients.length === (selectedMeal.ingredients || "").split('\n').filter(i => i.trim()).length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedIngredients.length > 0 && (
                    <button onClick={() => {
                      const groceryMap = new Map(groceries.map(g => [g.name.toLowerCase(), g]));
                      selectedIngredients.forEach((name, i) => {
                        const key = name.toLowerCase();
                        if (!groceryMap.has(key)) {
                          groceryMap.set(key, { id: Date.now() + i, name, checked: false });
                        }
                      });
                      const merged = Array.from(groceryMap.values());
                      setGroceries(merged);
                      const count = merged.length - groceries.length;
                      setAddedConfirm(count > 0 ? `${count} item${count > 1 ? 's' : ''} added` : 'Already in list');
                      setSelectedIngredients([]);
                      setTimeout(() => setAddedConfirm(null), 2500);
                    }} className="spring-press text-xs font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-1.5">
                      <ShoppingCart className="w-3 h-3" /> Add {selectedIngredients.length} to List
                    </button>
                  )}
                </div>
              )}
              {addedConfirm && (
                <div className="mt-2 flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl animate-bounce-in">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-bold">{addedConfirm}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 ring-1 ring-slate-200">
              <span className="text-sm font-bold text-slate-700">Serves {servings}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setServings(v => Math.max(1, v - 1))} className="w-8 h-8 rounded-full bg-slate-100 font-bold">-</button>
                <button onClick={() => setServings(v => Math.min(12, v + 1))} className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold">+</button>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-900/5"><h4 className="font-bold text-slate-800 mb-2">Instructions</h4><ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2">{(selectedMeal.instructions || "").split('\n').map((item, i) => <li key={i}>{item}</li>)}</ol></div>
            {isParent ? (
              <DetailActions
                onClose={closeMealModal}
                onSave={handleEditClick}
                saveLabel="Edit"
                onDelete={() => { closeMealModal(); onDelete(selectedMeal.id); }}
              />
            ) : (
              <Button onClick={closeMealModal} variant="secondary" className="flex-1">Close</Button>
            )}
          </div>
        )}
        {selectedMeal && isEditing && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Recipe Name</label><input type="text" value={editForm.meal} onChange={e => setEditForm({...editForm, meal: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" required /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Ingredients</label><textarea value={editForm.ingredients} onChange={e => setEditForm({...editForm, ingredients: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Instructions</label><textarea value={editForm.instructions} onChange={e => setEditForm({...editForm, instructions: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]" /></div>
            <div className="flex gap-3 pt-2"><Button type="button" onClick={() => setIsEditing(false)} variant="secondary" className="flex-1">Cancel</Button><Button type="submit" className="flex-1">Save Changes</Button></div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isGroceryModalOpen} onClose={() => setIsGroceryModalOpen(false)} title="🛒 Grocery List" fullHeight>
        <div className="flex flex-col h-full h-[60vh]">
          <div className="flex items-center justify-between bg-slate-50 text-slate-700 p-3 rounded-xl border border-slate-200 mb-3 shrink-0">
            <div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-emerald-500" /><span className="text-sm font-bold">{groceries.length} item{groceries.length !== 1 ? 's' : ''} · {groceries.filter(g => g.checked).length} done</span></div>
            <div className="flex gap-1.5">
              {groceries.some(g => g.checked) && <button onClick={() => setGroceries(groceries.filter(g => !g.checked))} className="text-xs font-bold bg-white px-2 py-1 rounded-lg shadow-sm hover:scale-105 transition-transform active:scale-95 border border-slate-200 text-rose-500">Clear Done</button>}
              <button onClick={generateGroceries} className="text-xs font-bold bg-white px-2 py-1 rounded-lg shadow-sm hover:scale-105 transition-transform active:scale-95 border border-slate-200">Refresh</button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              value={manualGroceryItem}
              onChange={(e) => setManualGroceryItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualGroceryItem(); } }}
              placeholder="Add grocery item"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium"
            />
            <button onClick={addManualGroceryItem} className="px-3 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl">Add</button>
            {isParent && <button onClick={shareGroceryWithCoParent} className="px-3 py-2 text-xs font-bold bg-indigo-500 text-white rounded-xl">Share</button>}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar pb-4 relative">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3"><Loader2 className="w-8 h-8 text-slate-400 animate-spin" /><p className="text-sm font-medium text-slate-500">Compiling ingredients...</p></div>
            ) : (
              <div className="space-y-2">
                {groceries.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${item.checked ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                    <div onClick={() => toggleGrocery(item.id)} className={`w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${item.checked ? 'bg-slate-800 border-slate-800' : 'border-slate-300'}`}>{item.checked && <Check className="w-3 h-3 text-white" />}</div>
                    <span onClick={() => toggleGrocery(item.id)} className={`font-medium flex-1 cursor-pointer ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.name}</span>
                    <button onClick={() => setGroceries(groceries.filter(g => g.id !== item.id))} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-rose-50 transition-colors text-slate-300 hover:text-rose-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => setIsGroceryModalOpen(false)} className="mt-auto shrink-0 pt-2">Close List</Button>
        </div>
      </Modal>
    </div>
  );
};

