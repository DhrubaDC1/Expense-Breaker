import React, { useState, useRef } from 'react';
import { X, Mic, Sparkles, Camera, Plus } from 'lucide-react';
import { useApp } from '../AppContext';
import { CATEGORIES, DEFAULT_CURRENCY } from '../constants';
import { extractTransactionFromImage, parseSmartImport } from '../services/aiService';
import { useWebHaptics } from 'web-haptics/react';
import { GlassCard } from './ui';

type Tab = 'ai' | 'scan' | 'manual';

interface Props { isOpen: boolean; onClose: () => void; }

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-text" style={{ fontSize: 9 }}>{label}</div>
      <div style={{ fontSize: 13, marginTop: 3 }}>{value}</div>
    </div>
  );
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

export default function AddTransactionModal({ isOpen, onClose }: Props) {
  const { addTransaction, currency } = useApp();
  const { trigger } = useWebHaptics();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('ai');

  // AI parse state
  const [aiText, setAiText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<any>(null);

  // Manual state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'expense' | 'income'>('expense');

  // Receipt scan state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleParse = async () => {
    if (!aiText.trim()) return;
    setParsing(true);
    setParsed(null);
    try {
      const results = await parseSmartImport(aiText);
      if (results.length > 0) setParsed(results[0]);
    } catch {
      setParsed(null);
    } finally {
      setParsing(false);
    }
  };

  const confirmParsed = async () => {
    if (!parsed) return;
    await addTransaction({
      amount: parsed.amount,
      currency: (parsed.currency || currency) as any,
      exchangeRateAtEntry: 1,
      category: parsed.category || CATEGORIES[0].name,
      date: parsed.date || new Date().toISOString().split('T')[0],
      note: parsed.merchant ? `${parsed.merchant}${parsed.note ? ' — ' + parsed.note : ''}` : (parsed.note || ''),
      type: parsed.amount > 0 ? 'income' : 'expense',
    });
    trigger('success');
    setParsed(null);
    setAiText('');
    onClose();
  };

  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await extractTransactionFromImage(base64);
      setScanResult(result);
      setScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const confirmScan = async () => {
    if (!scanResult) return;
    await addTransaction({
      amount: scanResult.amount,
      currency: (scanResult.currency || currency) as any,
      exchangeRateAtEntry: 1,
      category: scanResult.category || CATEGORIES[0].name,
      date: scanResult.date || new Date().toISOString().split('T')[0],
      note: `${scanResult.merchant || ''} ${scanResult.note || ''}`.trim(),
      type: 'expense',
    });
    trigger('success');
    setScanResult(null);
    onClose();
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) { trigger('error'); return; }
    await addTransaction({
      amount: parseFloat(amount),
      currency: currency as any,
      exchangeRateAtEntry: 1,
      category, date, note, type,
    });
    trigger('success');
    setAmount(''); setNote('');
    onClose();
  };

  if (!isOpen) return null;

  const TABS: Array<{ id: Tab; label: string; Icon: typeof Sparkles }> = [
    { id: 'ai',     label: 'AI Parse',     Icon: Sparkles },
    { id: 'scan',   label: 'Receipt Scan', Icon: Camera   },
    { id: 'manual', label: 'Manual',       Icon: Plus     },
  ];
  const tabIdx = TABS.findIndex(t => t.id === tab);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div style={{
        position: 'fixed', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 95, width: 560, maxWidth: '92vw',
        animation: 'fadeIn 0.4s var(--ease-spring) both',
      }}>
        <GlassCard strong style={{ padding: 24 }}>
          {/* Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div className="h-display" style={{ fontSize: 22 }}>Log Entry</div>
              <div className="label-text" style={{ marginTop: 2 }}>AI parsing · receipt scan · or manual</div>
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

          {/* Tab switcher */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            padding: 4, marginTop: 14,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-edge-soft)',
            borderRadius: 12, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 4, bottom: 4,
              left: `calc(${tabIdx} * 33.33% + 4px)`,
              width: 'calc(33.33% - 4px)',
              background: 'rgba(16,229,163,0.12)',
              border: '1px solid color-mix(in oklab, var(--mint) 40%, transparent)',
              borderRadius: 9,
              transition: 'left 0.4s var(--ease-spring)',
            }} />
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding: '10px 12px', fontSize: 12,
                position: 'relative', zIndex: 1,
                color: tab === id ? 'var(--mint)' : 'var(--ink-mute)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'color 0.3s',
              }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div style={{ marginTop: 18 }}>

            {/* AI Parse tab */}
            {tab === 'ai' && (
              <div className="view-enter">
                <div className="label-text" style={{ marginBottom: 8 }}>Describe the transaction naturally</div>
                <textarea
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  rows={3}
                  placeholder='e.g. "Coffee at Star Bucks, 320 BDT, cash" or paste CSV…'
                  style={{ width: '100%', padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-edge-soft)', outline: 0, fontSize: 13, color: 'var(--ink)', resize: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="btn" style={{ fontSize: 11 }}><Mic size={12} /> Voice</button>
                  <button className="btn btn-primary" onClick={handleParse} disabled={parsing || !aiText.trim()} style={{ marginLeft: 'auto' }}>
                    {parsing ? 'Parsing…' : <><Sparkles size={13} /> Parse</>}
                  </button>
                </div>
                {parsed && (
                  <div className="view-enter" style={{ marginTop: 14, padding: 14, borderRadius: 12, background: 'color-mix(in oklab, var(--mint) 8%, transparent)', border: '1px solid color-mix(in oklab, var(--mint) 30%, transparent)' }}>
                    <div style={{ fontSize: 11, color: 'var(--mint)', marginBottom: 8 }}>
                      <Sparkles size={11} style={{ display: 'inline', verticalAlign: -1 }} /> Parsed with {Math.round((parsed.confidence || 0.9) * 100)}% confidence
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                      <Field label="Merchant" value={parsed.merchant || '—'} />
                      <Field label="Amount" value={`${parsed.currency || currency} ${parsed.amount}`} />
                      <Field label="Category" value={parsed.category || '—'} />
                      <Field label="Date" value={parsed.date || 'Today'} />
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={confirmParsed}>
                      Confirm & Save
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Receipt scan tab */}
            {tab === 'scan' && (
              <div className="view-enter">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleScanFile} style={{ display: 'none' }} />
                {!scanResult ? (
                  <div style={{
                    padding: '40px 20px',
                    border: '1.5px dashed var(--glass-edge)',
                    borderRadius: 14, background: 'rgba(255,255,255,0.015)', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, margin: '0 auto 12px',
                      background: 'linear-gradient(135deg, var(--mint), var(--violet))',
                      display: 'grid', placeItems: 'center', color: '#04201a',
                      boxShadow: '0 10px 24px -8px rgba(16,229,163,0.4)',
                    }}>
                      <Camera size={24} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {scanning ? 'Scanning receipt…' : 'Drop receipt or click to capture'}
                    </div>
                    <div className="label-text" style={{ marginTop: 4 }}>PNG, JPG, HEIF · AI-powered OCR</div>
                    <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => fileInputRef.current?.click()} disabled={scanning}>
                      Choose file
                    </button>
                  </div>
                ) : (
                  <div className="view-enter" style={{ padding: 14, borderRadius: 12, background: 'color-mix(in oklab, var(--mint) 8%, transparent)', border: '1px solid color-mix(in oklab, var(--mint) 30%, transparent)' }}>
                    <div style={{ fontSize: 11, color: 'var(--mint)', marginBottom: 8 }}>
                      <Sparkles size={11} style={{ display: 'inline', verticalAlign: -1 }} /> OCR complete — {Math.round((scanResult.confidence || 0.9) * 100)}% confidence
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                      <Field label="Merchant" value={scanResult.merchant || '—'} />
                      <Field label="Amount" value={`${scanResult.currency || currency} ${scanResult.amount}`} />
                      <Field label="Category" value={scanResult.category || '—'} />
                      <Field label="Date" value={scanResult.date || 'Today'} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn" style={{ flex: 1 }} onClick={() => setScanResult(null)}>Re-scan</button>
                      <button className="btn btn-primary" style={{ flex: 2 }} onClick={confirmScan}>Confirm & Save</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual tab */}
            {tab === 'manual' && (
              <form className="view-enter" onSubmit={handleManualSubmit} style={{ display: 'grid', gap: 10 }}>
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
                <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Save Entry</button>
              </form>
            )}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
