import React, { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Wallet, AlertTriangle, Trash2, Pencil } from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../ToastContext';
import { GlassCard, LiquidBar, AnimatedNumber } from './ui';
import { CATEGORIES } from '../constants';
import { useIsMobile } from '../lib/useIsMobile';
import { Budget } from '../types';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function fmtMonth(m: string) {
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-edge-soft)',
  outline: 0, fontSize: 13, color: 'var(--ink)',
};

function AddEditBudgetModal({
  onClose,
  existing,
  defaultCategoryId,
  month,
  takenCategories,
}: {
  onClose: () => void;
  existing?: Budget;
  defaultCategoryId?: string;
  month: string;
  takenCategories: Set<string>;
}) {
  const { addBudget, updateBudget } = useApp();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const expenseCategories = CATEGORIES.filter(c => c.type === 'expense');
  const available = existing
    ? expenseCategories
    : expenseCategories.filter(c => !takenCategories.has(c.name));

  const [categoryId, setCategoryId] = useState(
    existing?.categoryId ?? defaultCategoryId ?? available[0]?.name ?? ''
  );
  const [amount, setAmount] = useState(existing?.amount ? String(existing.amount) : '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount) return;
    if (existing) {
      await updateBudget(existing.id, { amount: parseFloat(amount) });
      showToast('Budget updated!', 'success');
    } else {
      await addBudget({ categoryId, amount: parseFloat(amount), month });
      showToast('Budget set!', 'success');
    }
    onClose();
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 95, width: isMobile ? '92vw' : 440, animation: 'fadeIn 0.4s var(--ease-spring) both',
      }}>
        <GlassCard strong style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div className="h-display" style={{ fontSize: 20 }}>{existing ? 'Edit Budget' : 'Set Budget'}</div>
            <button onClick={onClose} style={{ color: 'var(--ink-mute)' }}>✕</button>
          </div>
          <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
            <div>
              <div className="label-text" style={{ marginBottom: 6 }}>Category</div>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                disabled={!!existing}
                style={{ ...INPUT_STYLE, opacity: existing ? 0.6 : 1 }}
              >
                {available.map(c => (
                  <option key={c.name} value={c.name} style={{ background: '#0a0f0e' }}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="label-text" style={{ marginBottom: 6 }}>Monthly limit</div>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 15000"
                min="0"
                style={INPUT_STYLE}
              />
            </div>
            <div style={{
              padding: '8px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.025)', border: '1px solid var(--glass-edge-soft)',
              fontSize: 12, color: 'var(--ink-mute)',
            }}>
              Month: {fmtMonth(month)}
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              {existing ? 'Update Budget' : 'Set Budget'}
            </button>
          </form>
        </GlassCard>
      </div>
    </>
  );
}

export default function Budgets({ contentPad = '0 32px' }: { contentPad?: string }) {
  const { budgets, deleteBudget, transactions, currency } = useApp();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [month, setMonth] = useState(currentMonth);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Budget | null>(null);
  const [addCategory, setAddCategory] = useState<string | undefined>();

  const expenseCategories = CATEGORIES.filter(c => c.type === 'expense');

  const monthBudgets = useMemo(
    () => budgets.filter(b => b.month === month),
    [budgets, month]
  );

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(month))
      .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [transactions, month]);

  const totalBudgeted = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + (spentByCategory[b.categoryId] || 0), 0);
  const remaining = totalBudgeted - totalSpent;

  const budgetedIds = useMemo(() => new Set(monthBudgets.map(b => b.categoryId)), [monthBudgets]);

  const unbudgetedWithSpending = expenseCategories.filter(
    c => !budgetedIds.has(c.name) && spentByCategory[c.name]
  );

  const openAdd = (categoryId?: string) => {
    setAddCategory(categoryId);
    setAddOpen(true);
  };

  return (
    <div style={{ padding: contentPad }}>
      {/* Header */}
      <div className="view-enter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div className="h-display" style={{ fontSize: isMobile ? 28 : 40 }}>Budgets</div>
          <div className="label-text" style={{ marginTop: 4 }}>Monthly spending limits by category</div>
        </div>
        <button className="btn btn-primary" onClick={() => openAdd()} style={{ padding: '10px 14px' }}>
          <Plus size={14} /> Set Budget
        </button>
      </div>

      {/* Month selector */}
      <div className="view-enter" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, animationDelay: '40ms' }}>
        <button
          onClick={() => setMonth(m => shiftMonth(m, -1))}
          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-edge-soft)', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)' }}
        >
          <ChevronLeft size={14} />
        </button>
        <div className="h-display" style={{ fontSize: 16, flex: 1, textAlign: 'center' }}>{fmtMonth(month)}</div>
        <button
          onClick={() => setMonth(m => shiftMonth(m, 1))}
          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-edge-soft)', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Summary strip */}
      {monthBudgets.length > 0 && (
        <div className="view-enter" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20, animationDelay: '60ms' }}>
          {(
          [
            { label: 'Total Budget', value: totalBudgeted, color: 'var(--ink)', prefix: '' },
            { label: 'Total Spent', value: totalSpent, color: totalSpent > totalBudgeted ? '#FF7AC6' : 'var(--mint)', prefix: '' },
            { label: 'Remaining', value: Math.abs(remaining), color: remaining < 0 ? '#FF7AC6' : 'var(--mint)', prefix: remaining < 0 ? '−' : '+' },
          ] as { label: string; value: number; color: string; prefix: string }[]
        ).map(({ label, value, color, prefix }) => (
            <GlassCard key={label} style={{ padding: isMobile ? '14px 12px' : '16px 20px' }}>
              <div className="label-text" style={{ fontSize: 9, marginBottom: 6 }}>{label}</div>
              <div className="mono" style={{ fontSize: isMobile ? 15 : 20, color, fontWeight: 600 }}>
                {prefix}{currency}&nbsp;<AnimatedNumber value={value} />
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Budget cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
        {monthBudgets.length === 0 && unbudgetedWithSpending.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center' }}>
            <Wallet size={48} style={{ color: 'var(--ink-faint)', margin: '0 auto 16px', display: 'block' }} />
            <div style={{ fontSize: 18, color: 'var(--ink-mute)', fontWeight: 600 }}>No budgets for {fmtMonth(month)}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 8 }}>Set spending limits to stay on top of your finances.</div>
            <button className="btn btn-primary" onClick={() => openAdd()} style={{ marginTop: 20 }}>
              <Plus size={14} /> Set Budget
            </button>
          </div>
        ) : (
          <>
            {monthBudgets.map((b, i) => {
              const cat = expenseCategories.find(c => c.name === b.categoryId);
              const color = cat?.color || '#94a3b8';
              const spent = spentByCategory[b.categoryId] || 0;
              const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
              const over = spent > b.amount;
              return (
                <GlassCard key={b.id} className="view-enter" style={{ padding: 20, animationDelay: `${100 + i * 50}ms`, position: 'relative', overflow: 'hidden' }}>
                  {over && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #FF7AC6, #ff4d4d)' }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: `color-mix(in oklab, ${color} 18%, transparent)`,
                      border: `1px solid color-mix(in oklab, ${color} 35%, transparent)`,
                      color, display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 700,
                    }}>
                      {b.categoryId.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="h-display" style={{ fontSize: 15 }}>{b.categoryId}</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>
                        {over ? (
                          <span style={{ color: '#FF7AC6', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={10} />
                            Over by {currency}&nbsp;{(spent - b.amount).toLocaleString()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ink-faint)' }}>
                            {currency}&nbsp;{(b.amount - spent).toLocaleString()} left
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                      <button
                        onClick={() => setEditTarget(b)}
                        style={{ color: 'var(--ink-faint)', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--mint)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-faint)')}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={async () => { await deleteBudget(b.id); showToast('Budget deleted', 'info'); }}
                        style={{ color: 'var(--ink-faint)', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#FF9A9A')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-faint)')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <LiquidBar pct={Math.min(pct, 100)} color={over ? '#FF7AC6' : color} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--ink-mute)' }}>
                    <span className="mono" style={{ color: over ? '#FF7AC6' : color }}>
                      {currency}&nbsp;{spent.toLocaleString()} spent
                    </span>
                    <span className="mono">{Math.round(pct)}% of {currency}&nbsp;{b.amount.toLocaleString()}</span>
                  </div>
                </GlassCard>
              );
            })}

            {/* Unbudgeted categories with spending this month */}
            {unbudgetedWithSpending.map((cat, i) => (
              <GlassCard
                key={cat.name}
                className="view-enter"
                style={{
                  padding: 20, animationDelay: `${100 + (monthBudgets.length + i) * 50}ms`,
                  borderStyle: 'dashed', opacity: 0.75,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: `color-mix(in oklab, ${cat.color} 18%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${cat.color} 35%, transparent)`,
                    color: cat.color, display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 700,
                  }}>
                    {cat.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="h-display" style={{ fontSize: 15 }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
                      {currency}&nbsp;{(spentByCategory[cat.name] || 0).toLocaleString()} spent — no limit set
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '6px 10px', flexShrink: 0 }}
                    onClick={() => openAdd(cat.name)}
                  >
                    <Plus size={12} /> Set limit
                  </button>
                </div>
              </GlassCard>
            ))}
          </>
        )}
      </div>

      {addOpen && (
        <AddEditBudgetModal
          onClose={() => { setAddOpen(false); setAddCategory(undefined); }}
          defaultCategoryId={addCategory}
          month={month}
          takenCategories={budgetedIds}
        />
      )}
      {editTarget && (
        <AddEditBudgetModal
          onClose={() => setEditTarget(null)}
          existing={editTarget}
          month={month}
          takenCategories={budgetedIds}
        />
      )}
    </div>
  );
}
