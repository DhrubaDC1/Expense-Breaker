import React, { useMemo } from 'react';
import { useApp } from '../AppContext';
import { CATEGORIES } from '../constants';
import { GlassCard, AnimatedNumber, Donut } from './ui';
import { useIsMobile } from '../lib/useIsMobile';

/* Mini virtual card art */
function VirtualCard() {
  return (
    <div style={{
      position: 'absolute', right: -10, top: 18,
      width: 160, height: 100, borderRadius: 14,
      background: 'linear-gradient(135deg, rgba(16,229,163,0.18), rgba(154,140,255,0.1))',
      border: '1px solid var(--glass-edge)',
      transform: 'rotate(-10deg)',
      boxShadow: '0 16px 30px -12px rgba(0,0,0,0.5)',
      backdropFilter: 'blur(10px)',
      animation: 'drift1 12s ease-in-out infinite alternate',
      pointerEvents: 'none',
    }}>
      <div style={{ padding: 12, fontSize: 9, letterSpacing: '0.16em', color: 'var(--ink-mute)' }}>CLEARLEDGER</div>
      <div style={{ position: 'absolute', bottom: 12, left: 12, fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink)' }} className="mono">
        •• •• •• 4218
      </div>
      <div style={{ position: 'absolute', top: 14, right: 14, width: 18, height: 14, borderRadius: 3, background: 'linear-gradient(135deg, #FFC062, #FF7AC6)' }} />
    </div>
  );
}

function KpiLiquidity({ currency, isMobile }: { currency: string; isMobile: boolean }) {
  const { transactions } = useApp();
  const inflow  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const outflow = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = inflow - outflow;

  const prevInflow = inflow * 0.89; // mock prev period for MoM display
  const momPct = prevInflow > 0 ? ((inflow - prevInflow) / prevInflow * 100).toFixed(1) : '0';

  return (
    <GlassCard className="view-enter" style={{ padding: 24, minHeight: 220, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="label-text">Net Liquidity</div>
        <div className="chip chip-mint">+{momPct}% MoM</div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div className="h-display" style={{ fontSize: isMobile ? 34 : 48, letterSpacing: '-0.03em' }}>
          {currency}&nbsp;<AnimatedNumber value={balance} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--mint)', boxShadow: '0 0 8px var(--mint)' }} />
            <div className="label-text" style={{ fontSize: 9 }}>Inflow</div>
          </div>
          <div className="mono" style={{ fontSize: 18, marginTop: 4 }}>
            {currency}&nbsp;<AnimatedNumber value={inflow} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#FF7AC6', boxShadow: '0 0 8px #FF7AC6' }} />
            <div className="label-text" style={{ fontSize: 9 }}>Outflow</div>
          </div>
          <div className="mono" style={{ fontSize: 18, marginTop: 4 }}>
            {currency}&nbsp;<AnimatedNumber value={outflow} />
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div className="label-text" style={{ fontSize: 9 }}>Health Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div className="mono" style={{ fontSize: 18, color: 'var(--mint)' }}>
              {inflow > 0 && (inflow - outflow) / inflow > 0.3 ? 'A' : inflow > 0 && (inflow - outflow) / inflow > 0.1 ? 'B+' : 'C'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>by AI</div>
          </div>
        </div>
      </div>
      {!isMobile && <VirtualCard />}
    </GlassCard>
  );
}

function KpiAllocation() {
  const { transactions } = useApp();
  const segs = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return CATEGORIES
      .filter(c => totals[c.name] && c.type === 'expense')
      .map(c => ({ label: c.name, value: totals[c.name], color: c.color }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = segs.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <GlassCard className="view-enter" style={{ padding: 24, minHeight: 220, animationDelay: '60ms' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="label-text">Allocation</div>
        <div className="chip chip-violet">Auto-tagged</div>
      </div>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 14 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Donut segments={segs.slice(0, 6)} size={120} thickness={12} />
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="label-text" style={{ fontSize: 8 }}>Expenses</div>
              <div className="h-display" style={{ fontSize: 16 }}>
                {(total / 1000).toFixed(1)}k
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 6, flex: 1 }}>
          {segs.slice(0, 4).map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
              <span style={{ color: 'var(--ink-mute)', flex: 1 }}>{s.label.split(' ')[0]}</span>
              <span className="mono" style={{ color: 'var(--ink)' }}>{Math.round(s.value / total * 100)}%</span>
            </div>
          ))}
          {segs.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>No expenses yet</div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function LedgerRow({ t, idx }: { t: any; idx: number }) {
  const cat = CATEGORIES.find(c => c.name === t.category);
  const color = cat?.color || '#8a9892';
  const isPos = t.type === 'income';
  return (
    <div className="view-enter" style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 12,
      transition: 'background 0.2s',
      animationDelay: `${idx * 40}ms`,
    }}
    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        display: 'grid', placeItems: 'center',
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        color, border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
        fontSize: 13, fontWeight: 600,
        flexShrink: 0,
      }}>
        {t.category?.charAt(0) || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.note || t.category}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
          {t.category} · {t.date}
        </div>
      </div>
      <div className="mono" style={{
        fontSize: 14, fontWeight: 500, flexShrink: 0,
        color: isPos ? 'var(--mint)' : 'var(--ink)',
      }}>
        {isPos ? '+' : '−'}{t.currency}&nbsp;{t.amount.toLocaleString()}
      </div>
    </div>
  );
}

function LiveLedger() {
  const { transactions } = useApp();
  const items = transactions.slice(0, 6);
  return (
    <GlassCard className="view-enter" style={{ padding: 22, animationDelay: '120ms' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="h-display" style={{ fontSize: 18 }}>Live Ledger</div>
          <div className="chip chip-mint">
            <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--mint)', boxShadow: '0 0 6px var(--mint)' }} />
            {transactions.length} entries
          </div>
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '6px 10px' }}>
          View All
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        {items.length > 0
          ? items.map((t, i) => <React.Fragment key={t.id}><LedgerRow t={t} idx={i} /></React.Fragment>)
          : <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 12 }}>No transactions yet. Add your first entry!</div>
        }
      </div>
    </GlassCard>
  );
}

export default function Dashboard({ onCoach, contentPad = '0 32px' }: { onCoach?: () => void; contentPad?: string }) {
  const { currency } = useApp();
  const isMobile = useIsMobile();
  return (
    <div style={{ padding: contentPad, display: 'grid', gap: 16 }}>
      {/* Row 1: KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 16 }}>
        <KpiLiquidity currency={currency} isMobile={isMobile} />
        <KpiAllocation />
      </div>
      {/* Row 2: ledger */}
      <LiveLedger />
    </div>
  );
}
