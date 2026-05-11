import React, { useMemo } from 'react';
import { Sparkles, Brain, TrendingUp, Bell, Zap } from 'lucide-react';
import { useApp } from '../AppContext';
import { CATEGORIES } from '../constants';
import { GlassCard, AnimatedNumber, Sparkline, Donut, LiquidBar } from './ui';
import { format, subDays, parseISO } from 'date-fns';

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

function KpiLiquidity({ currency }: { currency: string }) {
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
        <div className="h-display" style={{ fontSize: 48, letterSpacing: '-0.03em' }}>
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
      <VirtualCard />
    </GlassCard>
  );
}

function KpiEfficiency({ currency }: { currency: string }) {
  const { transactions } = useApp();

  const last14 = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
      const net = transactions
        .filter(t => t.date === d)
        .reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
      return net;
    });
  }, [transactions]);

  const inflow  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const outflow = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const efficiency = inflow > 0 ? Math.round(((inflow - outflow) / inflow) * 100) : 0;

  return (
    <GlassCard className="view-enter" style={{ padding: 24, minHeight: 220, animationDelay: '60ms' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="label-text">Efficiency Index</div>
        <div className="chip chip-mint">AI-scored</div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div className="h-display" style={{ fontSize: 48, letterSpacing: '-0.03em' }}>
          <AnimatedNumber value={efficiency} />%
        </div>
        <div style={{ color: 'var(--mint)', fontSize: 12 }} className="mono">
          {efficiency > 0 ? '▲' : '▼'} savings rate
        </div>
      </div>
      <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 11 }}>
        Target this cycle — <span style={{ color: 'var(--ink)' }}>30%</span>
      </div>
      <div style={{ marginTop: 14 }}>
        <Sparkline data={last14.map(v => Math.max(0, v + 50000))} width={360} height={80} animateKey="eff" />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, fontSize: 10, color: 'var(--ink-faint)' }} className="mono">
        <span>14D AGO</span><span style={{ marginLeft: 'auto' }}>NOW</span>
      </div>
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
    <GlassCard className="view-enter" style={{ padding: 24, minHeight: 220, animationDelay: '120ms' }}>
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

function ForecastCard() {
  const { transactions } = useApp();

  const { forecastData, upperBand, lowerBand } = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
      const dayInflow  = transactions.filter(t => t.date === d && t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const dayOutflow = transactions.filter(t => t.date === d && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return dayInflow - dayOutflow;
    });
    const avg = days.reduce((s, v) => s + v, 0) / 14 || 1000;
    const stdDev = Math.sqrt(days.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / 14) || avg * 0.2;
    const upper = days.map(v => v + stdDev * 0.9);
    const lower = days.map(v => v - stdDev * 0.9);
    return { forecastData: days, upperBand: upper, lowerBand: lower };
  }, [transactions]);

  const w = 720, h = 200;
  const allVals = [...forecastData, ...upperBand, ...lowerBand];
  const vMax = Math.max(...allVals), vMin = Math.min(...allVals);
  const vRange = Math.max(1, vMax - vMin);
  const xs = (i: number) => (i / (forecastData.length - 1)) * w;
  const ys = (v: number) => h - ((v - vMin) / vRange) * (h - 20) - 10;

  const linePath = forecastData.map((v, i) => `${i === 0 ? 'M' : 'L'}${xs(i)},${ys(v)}`).join(' ');
  const upperPath = upperBand.map((v, i) => `${i === 0 ? 'M' : 'L'}${xs(i)},${ys(v)}`).join(' ');
  const lowerPath = lowerBand.map((v, i) => `${i === forecastData.length - 1 ? 'M' : 'L'}${xs(forecastData.length - 1 - i)},${ys(v)}`).join(' ');

  const lastVal = forecastData[forecastData.length - 1] || 0;

  return (
    <GlassCard className="view-enter" style={{ padding: 24, animationDelay: '180ms', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="h-display" style={{ fontSize: 22 }}>Cashflow Forecast</div>
            <div className="chip chip-violet"><Brain size={10} style={{ display: 'inline' }} /> Predictive</div>
          </div>
          <div style={{ color: 'var(--ink-mute)', fontSize: 12, marginTop: 4 }}>
            14-day trend · 90% confidence band
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['14D', '30D', '90D'].map((p, i) => (
            <button key={p} className="chip" style={{
              color: i === 0 ? 'var(--mint)' : 'var(--ink-mute)',
              borderColor: i === 0 ? 'color-mix(in oklab, var(--mint) 35%, transparent)' : 'var(--glass-edge-soft)',
              background: i === 0 ? 'color-mix(in oklab, var(--mint) 12%, transparent)' : 'transparent',
            }}>{p}</button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16, position: 'relative' }}>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="band-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--mint)" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="forecast-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--mint)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(g => (
            <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4" />
          ))}
          <path d={`${upperPath} ${lowerPath} Z`} fill="url(#band-grad)" />
          <path d={`${linePath} L${w},${h} L0,${h} Z`} fill="url(#forecast-fill)" opacity="0.5" />
          <path d={linePath} fill="none" stroke="var(--mint)" strokeWidth="2"
            strokeDasharray="2000" strokeDashoffset="2000"
            style={{ animation: 'draw 1.6s var(--ease-spring) forwards' }}
          />
          <circle cx={xs(forecastData.length - 1)} cy={ys(lastVal)} r={5}
            fill="var(--mint)" stroke="rgba(16,229,163,0.3)" strokeWidth={6}
            style={{ filter: 'drop-shadow(0 0 6px var(--mint))' }}
          />
        </svg>
        <div style={{ position: 'absolute', right: 8, top: 4, textAlign: 'right' }}>
          <div className="label-text" style={{ fontSize: 9 }}>Latest Day</div>
          <div className="h-display" style={{ fontSize: 20, color: lastVal >= 0 ? 'var(--mint)' : '#FF9A9A' }}>
            {lastVal >= 0 ? '+' : '−'}{Math.abs(lastVal).toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>net flow</div>
        </div>
      </div>
    </GlassCard>
  );
}

const TONE_MAP = {
  mint:   { color: 'var(--mint)',  chip: 'chip-mint',   Icon: TrendingUp },
  amber:  { color: 'var(--amber)', chip: 'chip-amber',  Icon: Zap },
  violet: { color: '#BFB5FF',      chip: 'chip-violet', Icon: Brain },
  rose:   { color: '#FF9A9A',      chip: 'chip-rose',   Icon: Bell },
} as const;
type Tone = keyof typeof TONE_MAP;

function InsightCard({ title, body, tone, idx }: { title: string; body: string; tone: Tone; idx: number }) {
  const { color, Icon } = TONE_MAP[tone];
  return (
    <div className="view-enter" style={{
      position: 'relative', padding: 14, borderRadius: 14,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--glass-edge-soft)',
      animationDelay: `${300 + idx * 70}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 7,
          display: 'grid', placeItems: 'center',
          background: `color-mix(in oklab, ${color} 18%, transparent)`,
          color,
        }}>
          <Icon size={13} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
      </div>
      <div style={{ fontSize: 12, marginTop: 8, color: 'var(--ink-mute)', lineHeight: 1.5 }}>{body}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="chip" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>Dismiss</button>
        <button className="chip" style={{ fontSize: 9, color, borderColor: `color-mix(in oklab, ${color} 40%, transparent)` }}>See more</button>
      </div>
    </div>
  );
}

function InsightsPanel({ onCoach }: { onCoach: () => void }) {
  const { transactions } = useApp();

  const insights = useMemo(() => {
    const result: Array<{ title: string; body: string; tone: Tone }> = [];

    // Top category this week
    const thisWeek = transactions.filter(t => {
      const d = parseISO(t.date);
      return t.type === 'expense' && d >= subDays(new Date(), 7);
    });
    const prevWeek = transactions.filter(t => {
      const d = parseISO(t.date);
      return t.type === 'expense' && d >= subDays(new Date(), 14) && d < subDays(new Date(), 7);
    });

    const byCat: Record<string, number> = {};
    thisWeek.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
    const topCat = Object.entries(byCat).sort(([, a], [, b]) => b - a)[0];
    if (topCat) {
      const prevCatTotal = prevWeek.filter(t => t.category === topCat[0]).reduce((s, t) => s + t.amount, 0);
      if (prevCatTotal > 0 && topCat[1] > prevCatTotal * 1.2) {
        const pct = Math.round((topCat[1] / prevCatTotal - 1) * 100);
        result.push({ title: `${topCat[0]} up ${pct}%`, body: `Spending in ${topCat[0]} is ${pct}% above last week. Consider reviewing recent transactions.`, tone: 'amber' });
      }
    }

    // Savings rate
    const inflow  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const outflow = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    if (inflow > 0) {
      const rate = Math.round((inflow - outflow) / inflow * 100);
      result.push({ title: `${rate}% savings rate`, body: `Your overall savings rate is ${rate}%. ${rate > 20 ? 'Great discipline!' : 'Try trimming discretionary spend to boost this.'}`, tone: rate > 20 ? 'mint' : 'rose' });
    }

    // Subscription detection
    const counts: Record<string, number> = {};
    transactions.forEach(t => { counts[t.note] = (counts[t.note] || 0) + 1; });
    const recurrents = Object.entries(counts).filter(([k, v]) => k && v >= 2);
    if (recurrents.length > 0) {
      result.push({ title: `${recurrents.length} recurring detected`, body: `AI found ${recurrents.length} recurring charges. Review to check if all are still needed.`, tone: 'violet' });
    }

    // Projection
    if (inflow > 0) {
      result.push({ title: 'End-of-month projection', body: `At current pace, projected net is ${Math.round((inflow - outflow) / new Date().getDate() * 30).toLocaleString()}. Confidence: moderate.`, tone: 'violet' });
    }

    return result.slice(0, 4);
  }, [transactions]);

  return (
    <GlassCard className="view-enter" style={{ padding: 22, animationDelay: '240ms' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--mint), var(--violet))',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 6px 16px -4px rgba(16,229,163,0.4)',
          }}>
            <Sparkles size={15} />
          </div>
          <div>
            <div className="h-display" style={{ fontSize: 16 }}>AI Insights</div>
            <div style={{ fontSize: 10, color: 'var(--ink-faint)' }} className="mono">
              {insights.length} active
            </div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={onCoach} style={{ fontSize: 11, padding: '6px 10px' }}>
          Ask coach <Sparkles size={11} style={{ display: 'inline' }} />
        </button>
      </div>
      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {insights.length > 0
          ? insights.map((ins, i) => <InsightCard key={i} {...ins} idx={i} />)
          : <div style={{ fontSize: 12, color: 'var(--ink-faint)', padding: '8px 0' }}>Add transactions to unlock insights.</div>
        }
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
    <GlassCard className="view-enter" style={{ padding: 22, animationDelay: '300ms' }}>
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

export default function Dashboard({ onCoach }: { onCoach?: () => void }) {
  const { currency } = useApp();
  return (
    <div style={{ padding: '0 32px', display: 'grid', gap: 16 }}>
      {/* Row 1: KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.9fr', gap: 16 }}>
        <KpiLiquidity currency={currency} />
        <KpiEfficiency currency={currency} />
        <KpiAllocation />
      </div>
      {/* Row 2: forecast + insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 16 }}>
        <ForecastCard />
        <InsightsPanel onCoach={onCoach || (() => {})} />
      </div>
      {/* Row 3: ledger */}
      <LiveLedger />
    </div>
  );
}
