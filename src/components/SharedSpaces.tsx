import React, { useState } from 'react';
import { Plus, Sparkles, Trash2, Users } from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../ToastContext';
import { GlassCard } from './ui';
import { useIsMobile } from '../lib/useIsMobile';

const SPACE_COLORS = ['#10E5A3', '#FF7AC6', '#9A8CFF', '#FFC062', '#7BD9E0'];

export default function SharedSpaces({ contentPad = '0 32px' }: { contentPad?: string }) {
  const { spaces, deleteSpace } = useApp();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [joinCode, setJoinCode] = useState('');

  return (
    <div style={{ padding: contentPad }}>
      {/* Header */}
      <div className="view-enter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div className="h-display" style={{ fontSize: isMobile ? 26 : 40 }}>Collaborative Spaces</div>
          <div className="label-text" style={{ marginTop: 4 }}>
            Multi-user real-time reconciliation · AI auto-split
          </div>
        </div>
        <button className="btn btn-primary">
          <Plus size={14} /> Initialize Space
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr', gap: 16, alignItems: 'start' }}>
        {/* Join panel */}
        <GlassCard className="view-enter" style={{ padding: 22, animationDelay: '60ms' }}>
          <div className="label-text">Join Existing Space</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Protocol ID…"
              className="mono"
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-edge-soft)',
                outline: 0, fontSize: 12, color: 'var(--ink)',
              }}
            />
            <button className="btn" style={{ padding: '10px 14px' }}>Join</button>
          </div>
          <div style={{
            marginTop: 18, padding: 12, borderRadius: 10,
            background: 'rgba(154,140,255,0.06)',
            border: '1px solid color-mix(in oklab, var(--violet) 30%, transparent)',
            fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.5,
          }}>
            <Sparkles size={11} style={{ display: 'inline', color: '#BFB5FF', marginRight: 4, verticalAlign: -1 }} />
            Tip: Share the space ID with collaborators. AI will auto-split shared expenses when you add receipts.
          </div>
        </GlassCard>

        {/* Spaces list */}
        <div style={{ display: 'grid', gap: 12 }}>
          {spaces.length === 0 ? (
            <GlassCard className="view-enter" style={{ padding: 40, textAlign: 'center', animationDelay: '120ms' }}>
              <Users size={40} style={{ color: 'var(--ink-faint)', margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 16, color: 'var(--ink-mute)', fontWeight: 600 }}>No shared spaces yet</div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 6 }}>
                Create or join a space to start collaborating on expenses.
              </div>
            </GlassCard>
          ) : (
            spaces.map((s, i) => {
              const color = SPACE_COLORS[i % SPACE_COLORS.length];
              return (
                <GlassCard key={s.id} className="view-enter" style={{ padding: 18, animationDelay: `${120 + i * 60}ms` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Member avatars */}
                    <div style={{ display: 'flex', marginRight: 8 }}>
                      {Array.from({ length: Math.min(4, s.members.length) }).map((_, j) => (
                        <div key={j} style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: `linear-gradient(${j * 60}deg, ${color}, ${j % 2 ? '#9A8CFF' : '#7BD9E0'})`,
                          border: '2px solid var(--bg-1)',
                          marginLeft: j === 0 ? 0 : -10,
                          display: 'grid', placeItems: 'center',
                          fontSize: 10, fontWeight: 600, color: '#04201a',
                        }}>
                          {String.fromCharCode(65 + j)}
                        </div>
                      ))}
                      {s.members.length > 4 && (
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.06)',
                          border: '2px solid var(--bg-1)', marginLeft: -10,
                          display: 'grid', placeItems: 'center',
                          fontSize: 10, color: 'var(--ink-mute)',
                        }}>+{s.members.length - 4}</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="h-display" style={{ fontSize: 15 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
                        {s.members.length} member{s.members.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      onClick={async () => { await deleteSpace(s.id); showToast('Space deleted', 'info'); }}
                      style={{ color: 'var(--ink-faint)', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FF9A9A')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-faint)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
