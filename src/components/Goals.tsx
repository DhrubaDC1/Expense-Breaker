import React, { useState } from 'react';
import { Plus, Sparkles, Trash2, Target } from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../ToastContext';
import { GlassCard, LiquidBar } from './ui';

const GOAL_COLORS = ['#FF7AC6', '#10E5A3', '#9A8CFF', '#FFC062', '#7BD9E0'];

function AddGoalModal({ onClose }: { onClose: () => void }) {
  const { addGoal } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;
    await addGoal({ name, targetAmount: parseFloat(target), currentAmount: parseFloat(current) || 0, deadline });
    showToast('Goal created!', 'success');
    onClose();
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 95, width: 480, animation: 'fadeIn 0.4s var(--ease-spring) both' }}>
        <GlassCard strong style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div className="h-display" style={{ fontSize: 20 }}>New Goal</div>
            <button onClick={onClose} style={{ color: 'var(--ink-mute)' }}>✕</button>
          </div>
          <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Goal name', val: name, set: setName, placeholder: 'e.g. Tokyo Trip', type: 'text' },
              { label: 'Target amount', val: target, set: setTarget, placeholder: '250000', type: 'number' },
              { label: 'Already saved', val: current, set: setCurrent, placeholder: '0', type: 'number' },
              { label: 'Target date', val: deadline, set: setDeadline, placeholder: '', type: 'date' },
            ].map(({ label, val, set, placeholder, type }) => (
              <div key={label}>
                <div className="label-text" style={{ marginBottom: 6 }}>{label}</div>
                <input
                  type={type}
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-edge-soft)', outline: 0, fontSize: 13, color: 'var(--ink)' }}
                />
              </div>
            ))}
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Create Goal</button>
          </form>
        </GlassCard>
      </div>
    </>
  );
}

export default function Goals() {
  const { goals, deleteGoal } = useApp();
  const { showToast } = useToast();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div style={{ padding: '0 32px' }}>
      {/* Header */}
      <div className="view-enter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div className="h-display" style={{ fontSize: 40 }}>Financial Goals</div>
          <div className="label-text" style={{ marginTop: 4 }}>AI-coached pathing toward your targets</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)} style={{ padding: '10px 14px' }}>
          <Plus size={14} /> New Goal
        </button>
      </div>

      {/* AI coach banner */}
      {goals.length > 0 && (
        <GlassCard className="view-enter" style={{
          padding: 22, marginBottom: 16, animationDelay: '60ms',
          background: 'linear-gradient(135deg, rgba(16,229,163,0.06), rgba(154,140,255,0.06))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--mint), var(--violet))',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 10px 24px -8px rgba(16,229,163,0.4)',
            }}>
              <Sparkles size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 2 }}>Coach suggestion</div>
              <div style={{ fontSize: 15, lineHeight: 1.5 }}>
                Review your goals regularly and track small weekly deposits — consistency compounds over time. Want a savings schedule?
              </div>
            </div>
            <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>
              Get Plan
            </button>
          </div>
        </GlassCard>
      )}

      {/* Goal cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {goals.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center' }}>
            <Target size={48} style={{ color: 'var(--ink-faint)', margin: '0 auto 16px', display: 'block' }} />
            <div style={{ fontSize: 18, color: 'var(--ink-mute)', fontWeight: 600 }}>No goals yet</div>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 8 }}>Create your first financial goal to get started.</div>
            <button className="btn btn-primary" onClick={() => setAddOpen(true)} style={{ marginTop: 20 }}>
              <Plus size={14} /> New Goal
            </button>
          </div>
        ) : (
          goals.map((g, i) => {
            const color = GOAL_COLORS[i % GOAL_COLORS.length];
            const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            return (
              <GlassCard key={g.id} className="view-enter" style={{ padding: 22, animationDelay: `${120 + i * 60}ms`, overflow: 'hidden', position: 'relative' }}>
                {/* Background glow */}
                <div style={{
                  position: 'absolute', top: -40, right: -40,
                  width: 160, height: 160, borderRadius: '50%',
                  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                  opacity: 0.25, filter: 'blur(20px)', pointerEvents: 'none',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `color-mix(in oklab, ${color} 18%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${color} 35%, transparent)`,
                    color, display: 'grid', placeItems: 'center',
                    fontSize: 18, fontWeight: 700,
                  }}>
                    {g.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="h-display" style={{ fontSize: 18 }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                      {g.deadline ? `Target: ${g.deadline}` : 'No deadline set'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="h-display" style={{ fontSize: 18 }}>{pct.toFixed(0)}%</div>
                    <button
                      onClick={async () => { await deleteGoal(g.id); showToast('Goal deleted', 'info'); }}
                      style={{ color: 'var(--ink-faint)', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FF9A9A')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-faint)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 18 }}>
                  <LiquidBar pct={pct} color={color} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--ink-mute)' }}>
                  <span className="mono" style={{ color }}>{g.currentAmount.toLocaleString()} saved</span>
                  <span className="mono">of {g.targetAmount.toLocaleString()}</span>
                </div>
                <div style={{ marginTop: 14, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--glass-edge-soft)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <Sparkles size={11} style={{ color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--ink-mute)' }}>
                    {pct > 80 ? 'On track. Maintain weekly cadence.' : pct > 50 ? 'Slightly behind. Small consistent deposits close the gap.' : 'Behind pace. Try setting up an auto-save schedule.'}
                  </span>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {addOpen && <AddGoalModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
