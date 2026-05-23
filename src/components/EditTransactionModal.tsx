import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../AppContext';
import { CATEGORIES } from '../constants';
import { Transaction } from '../types';
import { GlassCard } from './ui';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

function Input({ label, placeholder, mono, type = 'text', value, onChange }: {
  label: string; placeholder?: string; mono?: boolean; type?: string;
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="label-text" style={{ marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={mono ? 'mono' : ''}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-edge-soft)', outline: 0, fontSize: 13, color: 'var(--ink)' }}
      />
    </div>
  );
}

export default function EditTransactionModal({ transaction, onClose }: Props) {
  const { updateTransaction } = useApp();

  const [amount, setAmount] = useState(String(transaction.amount));
  const [category, setCategory] = useState(transaction.category);
  const [note, setNote] = useState(transaction.note || '');
  const [date, setDate] = useState(transaction.date);
  const [type, setType] = useState<'expense' | 'income'>(transaction.type);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    try {
      await updateTransaction(transaction.id, {
        amount: parseFloat(amount),
        currency: transaction.currency,
        exchangeRateAtEntry: transaction.exchangeRateAtEntry,
        category,
        date,
        note,
        type,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="log-entry-modal">
        <GlassCard strong className="log-entry-card">
          <div className="log-entry-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div className="h-display" style={{ fontSize: 22 }}>Edit Entry</div>
                <div className="label-text" style={{ marginTop: 2 }}>Update transaction details</div>
              </div>
              <button onClick={onClose} className="glass-spec" style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-edge-soft)',
                color: 'var(--ink-mute)', display: 'grid', placeItems: 'center',
              }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
              {/* Type toggle */}
              <div style={{ display: 'flex', gap: 6 }}>
                {(['expense', 'income'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="chip"
                    style={{
                      cursor: 'pointer', flex: 1, justifyContent: 'center',
                      color: type === t ? (t === 'income' ? 'var(--mint)' : '#FF9A9A') : 'var(--ink-mute)',
                      borderColor: type === t ? `color-mix(in oklab, ${t === 'income' ? 'var(--mint)' : '#FF9A9A'} 40%, transparent)` : 'var(--glass-edge-soft)',
                      background: type === t ? `color-mix(in oklab, ${t === 'income' ? 'var(--mint)' : '#FF9A9A'} 12%, transparent)` : 'transparent',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <Input label="Note / Merchant" placeholder="e.g. Coffee shop" value={note} onChange={setNote} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input label="Amount" placeholder="0.00" mono type="number" value={amount} onChange={setAmount} />
                <Input label="Date" type="date" value={date} onChange={setDate} />
              </div>

              <div>
                <div className="label-text" style={{ marginBottom: 6 }}>Category</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATEGORIES.filter(c => c.type === type).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.name)}
                      className="chip"
                      style={{
                        cursor: 'pointer',
                        color: category === c.name ? c.color : 'var(--ink-mute)',
                        borderColor: category === c.name ? `color-mix(in oklab, ${c.color} 40%, transparent)` : 'var(--glass-edge-soft)',
                        background: category === c.name ? `color-mix(in oklab, ${c.color} 12%, transparent)` : 'transparent',
                        textTransform: 'none',
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: 2, background: c.color, display: 'inline-block' }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
