import React, { useContext, useMemo, useState } from 'react';
import { Star, Flame, Sparkles, CircleDollarSign, Trash2 } from 'lucide-react';
import { ThemeContext } from '../contexts/FamilyContext';
import { Button, RevealCard, Modal, DetailActions } from '../components/shared/Primitives';

const POINTS_PER_DOLLAR = 10;

export const RewardsView = ({ rewards, setRewards, points, onRedeem, isParent, lastRedeemed }) => {
  const { isChild } = useContext(ThemeContext);
  const [selectedReward, setSelectedReward] = useState(null);
  const [editReward, setEditReward] = useState(null);
  const [swipedRewardId, setSwipedRewardId] = useState(null);
  const [deletedReward, setDeletedReward] = useState(null);

  const nextReward = rewards?.filter((r) => r.cost > points).sort((a, b) => a.cost - b.cost)[0];
  const progress = nextReward ? Math.min(100, (points / nextReward.cost) * 100) : 100;
  const pointToUsd = useMemo(() => (points / POINTS_PER_DOLLAR).toFixed(2), [points]);

  const handleTouchStart = (e, rewardId) => {
    e.currentTarget.dataset.touchStartX = String(e.changedTouches[0].clientX);
    e.currentTarget.dataset.rewardId = String(rewardId);
  };

  const handleTouchEnd = (e) => {
    const delta = Number(e.currentTarget.dataset.touchStartX || 0) - e.changedTouches[0].clientX;
    if (delta > 40 && isParent) setSwipedRewardId(Number(e.currentTarget.dataset.rewardId));
    if (delta < -35) setSwipedRewardId(null);
  };

  const deleteWithUndo = (reward) => {
    setRewards(rewards.filter((r) => r.id !== reward.id));
    setDeletedReward(reward);
    setSwipedRewardId(null);
    setTimeout(() => setDeletedReward(null), 4500);
  };

  const undoDelete = () => {
    if (!deletedReward) return;
    setRewards((prev) => [...prev, deletedReward]);
    setDeletedReward(null);
  };

  return (
    <div className="space-y-5 animate-bounce-in" onClick={() => setSwipedRewardId(null)}>
      <RevealCard delay={0}>
        <div className="relative overflow-hidden rounded-[1.75rem] p-6 text-center" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <Star className="w-8 h-8 text-amber-900/30 fill-amber-900/20 mx-auto mb-3" />
            <p className="text-amber-900/60 text-[10px] font-bold uppercase tracking-widest">Your Balance</p>
            <p className="text-5xl font-black text-amber-900 tracking-tight mt-1 animate-count-up">{points}</p>
            <p className="text-amber-900/50 text-sm font-bold mt-1">points earned</p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/65 px-3 py-1.5 rounded-full text-[11px] font-bold text-amber-900">
              <CircleDollarSign className="w-3.5 h-3.5" /> 10 pts = $1 · Balance ≈ ${pointToUsd}
            </div>
          </div>
          {nextReward && !isParent && (
            <div className="relative z-10 mt-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-amber-900/50 text-[10px] font-bold uppercase tracking-wider">Next: {nextReward.title}</span>
                <span className="text-amber-900/60 text-[10px] font-bold">{nextReward.cost - points} pts to go</span>
              </div>
              <div className="h-2 bg-amber-800/20 rounded-full overflow-hidden">
                <div className="h-full bg-amber-900/40 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </RevealCard>

      <RevealCard delay={20}>
        <div className="bg-white rounded-[1.75rem] p-4 ring-1 ring-black/5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kid-friendly point guide</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50 rounded-xl py-2"><p className="text-xs font-black text-emerald-700">10–20</p><p className="text-[10px] text-emerald-600 font-semibold">quick chores</p></div>
            <div className="bg-indigo-50 rounded-xl py-2"><p className="text-xs font-black text-indigo-700">25–50</p><p className="text-[10px] text-indigo-600 font-semibold">daily tasks</p></div>
            <div className="bg-amber-50 rounded-xl py-2"><p className="text-xs font-black text-amber-700">75+</p><p className="text-[10px] text-amber-600 font-semibold">big wins</p></div>
          </div>
        </div>
      </RevealCard>

      {lastRedeemed && (
        <div className="animate-bounce-in bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[1.75rem] p-6 text-center shadow-xl shadow-emerald-500/30 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
          <div className="relative z-10">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-1">Reward Unlocked!</h3>
            <p className="text-white/80 font-bold text-base">{lastRedeemed.title}</p>
            <p className="text-white/60 text-sm font-medium mt-1">−{lastRedeemed.cost} points</p>
          </div>
        </div>
      )}

      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Available Rewards</h3>

      <div className="grid grid-cols-1 gap-3">
        {rewards?.map((reward, idx) => {
          const canAfford = points >= reward.cost;
          return (
            <RevealCard key={reward.id} delay={idx * 60}>
              <div
                onClick={() => { setSelectedReward(reward); setEditReward({ ...reward }); }}
                onTouchStart={(e) => handleTouchStart(e, reward.id)}
                onTouchEnd={handleTouchEnd}
                className={`bg-white rounded-[1.75rem] p-5 shadow-sm ring-1 transition-all cursor-pointer ${canAfford && !isParent ? 'ring-amber-300 shadow-amber-100' : 'ring-black/5'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${reward.color} ${canAfford ? 'shadow-lg' : ''}`}>
                    {reward.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-base">{reward.title}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span className="text-sm font-bold text-amber-600">{reward.cost} pts</span>
                      {!isParent && <span className="text-[10px] font-semibold text-slate-400">(${(reward.cost / POINTS_PER_DOLLAR).toFixed(2)})</span>}
                      {canAfford && !isParent && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Affordable!</span>}
                    </div>
                  </div>
                  {isParent && swipedRewardId === reward.id ? (
                    <button onClick={(e) => { e.stopPropagation(); deleteWithUndo(reward); }} className="p-2 text-rose-500 bg-rose-50 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      disabled={points < reward.cost || isParent}
                      onClick={(e) => { e.stopPropagation(); onRedeem(reward.cost, reward.title); }}
                      className={`spring-press shrink-0 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                        isParent ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                        canAfford ? 'bg-amber-400 text-amber-900 shadow-md shadow-amber-400/30 hover:bg-amber-300' :
                        'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isParent ? 'Swipe' : canAfford ? 'Unlock' : `−${reward.cost - points}`}
                    </button>
                  )}
                </div>
              </div>
            </RevealCard>
          );
        })}
      </div>

      {deletedReward && (
        <div className="fixed left-4 right-4 bottom-28 z-40 bg-slate-900 text-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
          <span className="text-sm font-semibold truncate">Reward deleted</span>
          <button onClick={undoDelete} className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-xl">Undo</button>
        </div>
      )}

      <Modal isOpen={!!selectedReward} onClose={() => setSelectedReward(null)} title="Reward Details">
        {selectedReward && (
          <div className="space-y-3">
            <div className="bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200">
              <p className="font-bold text-slate-900">{selectedReward.title}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Cost: {selectedReward.cost} points (${(selectedReward.cost / POINTS_PER_DOLLAR).toFixed(2)})</p>
            </div>
            {isParent ? (
              <div className="space-y-2">
                <input value={editReward.title} onChange={(e) => setEditReward({ ...editReward, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                <input type="number" value={editReward.cost} onChange={(e) => setEditReward({ ...editReward, cost: parseInt(e.target.value || '0', 10) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                <DetailActions
                  onClose={() => setSelectedReward(null)}
                  onSave={() => { setRewards(rewards.map((r) => r.id === editReward.id ? editReward : r)); setSelectedReward(editReward); }}
                  onDelete={() => { setRewards(rewards.filter((r) => r.id !== selectedReward.id)); setSelectedReward(null); }}
                />
              </div>
            ) : (
              <Button onClick={() => setSelectedReward(null)}>
                <Sparkles className="w-4 h-4" /> Nice! Close
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
