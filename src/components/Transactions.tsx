import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Trash2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { CATEGORIES } from '../constants';
import { GlassCard } from './ui';
import { useIsMobile } from '../lib/useIsMobile';

export default function Transactions({ contentPad = '0 32px' }: { contentPad?: string }) {
  const { transactions, deleteTransaction, currency } = useApp();
  const isMobile = useIsMobile();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (q && !`${t.note} ${t.category}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [transactions, q, cat]);

  const net = filtered.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);

  return (
    <div style={{ padding: contentPad }}>
      {/* Header */}
      <div className="view-enter" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div className="h-display" style={{ fontSize: isMobile ? 28 : 40 }}>Activity Log</div>
          <div className="label-text" style={{ marginTop: 4 }}>
            Real-time ledger · {transactions.length} entries · AI-classified
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="chip">
            Net&nbsp;<span className="mono" style={{ color: net >= 0 ? 'var(--mint)' : '#FF9A9A', marginLeft: 4 }}>
              {net >= 0 ? '+' : '−'}{currency}&nbsp;{Math.abs(net).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <GlassCard className="view-enter" style={{ padding: 18, animationDelay: '80ms' }}>
        {/* Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 12, flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-edge-soft)',
          }}>
            <Search size={14} style={{ color: 'var(--ink-mute)', flexShrink: 0 }} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder='Search transactions — note, category…'
              style={{ background: 'transparent', border: 0, outline: 0, flex: 1, fontSize: 12, color: 'var(--ink)' }}
            />
            <span className="chip chip-violet" style={{ fontSize: 9 }}>
              <Sparkles size={9} style={{ display: 'inline' }} />&nbsp;AI
            </span>
          </div>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {[{ name: 'all', color: '' }, ...CATEGORIES].map(c => {
            const active = c.name === cat;
            const color = (c as any).color || 'var(--mint)';
            return (
              <button
                key={c.name}
                onClick={() => setCat(c.name)}
                className="chip"
                style={{
                  cursor: 'pointer',
                  color: active ? color : 'var(--ink-mute)',
                  borderColor: active ? `color-mix(in oklab, ${color} 40%, transparent)` : 'var(--glass-edge-soft)',
                  background: active ? `color-mix(in oklab, ${color} 12%, transparent)` : 'transparent',
                  transition: 'all 0.25s var(--ease-soft)',
                  textTransform: 'none',
                }}
              >
                {(c as any).color && <span style={{ width: 6, height: 6, borderRadius: 2, background: (c as any).color, marginRight: 4, display: 'inline-block' }} />}
                {c.name === 'all' ? 'All' : c.name}
              </button>
            );
          })}
        </div>

        {/* Table header — desktop only */}
        {!isMobile && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr 1fr 1fr 0.5fr',
            gap: 10,
            padding: '8px 10px',
            fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            borderBottom: '1px solid var(--glass-edge-soft)',
          }}>
            <div>Note / Merchant</div>
            <div>Category</div>
            <div>Date</div>
            <div style={{ textAlign: 'right' }}>Value</div>
            <div style={{ textAlign: 'right' }}>Del</div>
          </div>
        )}

        {/* Rows */}
        <div>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 12 }}>
              {transactions.length === 0 ? 'No transactions yet. Add your first entry!' : 'No matches.'}
            </div>
          ) : isMobile ? (
            /* Mobile: card rows */
            filtered.map((t, i) => {
              const catInfo = CATEGORIES.find(c => c.name === t.category);
              const color = catInfo?.color || '#8a9892';
              return (
                <div
                  key={t.id}
                  className="view-enter"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 10px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    animationDelay: `${i * 30}ms`,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    display: 'grid', placeItems: 'center',
                    background: `color-mix(in oklab, ${color} 14%, transparent)`,
                    color, border: `1px solid color-mix(in oklab, ${color} 25%, transparent)`,
                    fontSize: 13, fontWeight: 600,
                  }}>
                    {t.category?.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink)' }}>
                      {t.note || t.category}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                      {t.category} · {t.date}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div className="mono" style={{
                      fontSize: 13, fontWeight: 500,
                      color: t.type === 'income' ? 'var(--mint)' : 'var(--ink)',
                    }}>
                      {t.type === 'income' ? '+' : '−'}{t.currency}&nbsp;{t.amount.toLocaleString()}
                    </div>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      style={{ color: 'var(--ink-faint)', padding: 6, borderRadius: 6, transition: 'color 0.2s' }}
                      onTouchStart={e => (e.currentTarget.style.color = '#FF9A9A')}
                      onTouchEnd={e => (e.currentTarget.style.color = 'var(--ink-faint)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            /* Desktop: table rows */
            filtered.map((t, i) => {
              const catInfo = CATEGORIES.find(c => c.name === t.category);
              const color = catInfo?.color || '#8a9892';
              return (
                <div
                  key={t.id}
                  className="view-enter"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.6fr 1fr 1fr 1fr 0.5fr',
                    gap: 10, alignItems: 'center',
                    padding: '12px 10px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    fontSize: 12,
                    animationDelay: `${i * 30}ms`,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      display: 'grid', placeItems: 'center',
                      background: `color-mix(in oklab, ${color} 14%, transparent)`,
                      color, border: `1px solid color-mix(in oklab, ${color} 25%, transparent)`,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {t.category?.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.note || t.category}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--ink-mute)' }}>{t.category}</div>
                  <div className="mono" style={{ color: 'var(--ink-mute)', fontSize: 11 }}>{t.date}</div>
                  <div className="mono" style={{
                    textAlign: 'right',
                    color: t.type === 'income' ? 'var(--mint)' : 'var(--ink)',
                    fontWeight: 500,
                  }}>
                    {t.type === 'income' ? '+' : '−'}{t.currency}&nbsp;{t.amount.toLocaleString()}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      style={{
                        color: 'var(--ink-faint)', padding: 4, borderRadius: 6,
                        transition: 'color 0.2s, background 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#FF9A9A'; e.currentTarget.style.background = 'rgba(255,106,107,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
}
