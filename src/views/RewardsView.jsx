import React, { useContext, useState } from 'react';
import { Star, Gift, Flame, Trash2 } from 'lucide-react';
import { ThemeContext } from '../contexts/FamilyContext';
import { Card, Button, Badge, RevealCard, Modal } from '../components/shared/Primitives';

export const RewardsView = ({ rewards, setRewards, points, onRedeem, isParent, lastRedeemed }) => {
  const { isChild } = useContext(ThemeContext);
  const [selectedReward, setSelectedReward] = useState(null);
  const [editReward, setEditReward] = useState(null);
  const nextReward = rewards?.filter(r => r.cost > points).sort((a,b) => a.cost - b.cost)[0];
  const progress = nextReward ? Math.min(100, (points / nextReward.cost) * 100) : 100;

  return (
    <div className="space-y-5 animate-bounce-in">
      {/* HERO BALANCE */}
      <RevealCard delay={0}>
        <div className="relative overflow-hidden rounded-3xl p-6 text-center" style={{background:'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)'}}>
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'20px 20px'}} />
          <div className="relative z-10">
            <Star className="w-8 h-8 text-amber-900/30 fill-amber-900/20 mx-auto mb-3" />
            <p className="text-amber-900/60 text-[10px] font-bold uppercase tracking-widest">Your Balance</p>
            <p className="text-5xl font-black text-amber-900 tracking-tight mt-1 animate-count-up">{points}</p>
            <p className="text-amber-900/50 text-sm font-bold mt-1">points earned</p>
          </div>
          {nextReward && !isParent && (
            <div className="relative z-10 mt-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-amber-900/50 text-[10px] font-bold uppercase tracking-wider">Next: {nextReward.title}</span>
                <span className="text-amber-900/60 text-[10px] font-bold">{nextReward.cost - points} pts to go</span>
              </div>
              <div className="h-2 bg-amber-800/20 rounded-full overflow-hidden">
                <div className="h-full bg-amber-900/40 rounded-full transition-all duration-700" style={{width:`${progress}%`}} />
              </div>
            </div>
          )}
        </div>
      </RevealCard>

      {/* CELEBRATION MOMENT */}
      {lastRedeemed && (
        <div className="animate-bounce-in bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl p-6 text-center shadow-xl shadow-emerald-500/30 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'16px 16px'}} />
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
              <div onClick={() => { setSelectedReward(reward); setEditReward({ ...reward }); }} className={`bg-white rounded-3xl p-5 shadow-sm ring-1 transition-all cursor-pointer ${canAfford && !isParent ? 'ring-amber-300 shadow-amber-100' : 'ring-black/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${reward.color} ${canAfford ? 'shadow-lg' : ''}`}>
                    {reward.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-base">{reward.title}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span className="text-sm font-bold text-amber-600">{reward.cost} pts</span>
                      {canAfford && !isParent && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Affordable!</span>}
                    </div>
                  </div>
                  <button
                    disabled={points < reward.cost || isParent}
                    onClick={(e) => { e.stopPropagation(); onRedeem(reward.cost, reward.title); }}
                    className={`spring-press shrink-0 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                      isParent ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                      canAfford ? 'bg-amber-400 text-amber-900 shadow-md shadow-amber-400/30 hover:bg-amber-300' :
                      'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isParent ? 'Kids only' : canAfford ? 'Unlock' : `−${reward.cost - points}`}
                  </button>
                </div>
              </div>
            </RevealCard>
          );
        })}
      </div>
      <Modal isOpen={!!selectedReward} onClose={() => setSelectedReward(null)} title="Reward Details">
        {selectedReward && (
          <div className="space-y-3">
            <div className="bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200">
              <p className="font-bold text-slate-900">{selectedReward.title}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Cost: {selectedReward.cost} points</p>
            </div>
            {isParent ? (
              <div className="space-y-2">
                <input value={editReward.title} onChange={(e) => setEditReward({ ...editReward, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                <input type="number" value={editReward.cost} onChange={(e) => setEditReward({ ...editReward, cost: parseInt(e.target.value || '0', 10) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => { setRewards(rewards.map(r => r.id === editReward.id ? editReward : r)); setSelectedReward(editReward); }}>Save</Button>
                  <Button variant="secondary" className="!bg-rose-50 !text-rose-600 !border-rose-200" onClick={() => { setRewards(rewards.filter(r => r.id !== selectedReward.id)); setSelectedReward(null); }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setSelectedReward(null)}>Close</Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};


