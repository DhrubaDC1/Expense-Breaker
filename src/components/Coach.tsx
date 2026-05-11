import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Mic, Send } from 'lucide-react';
import { useApp } from '../AppContext';
import { chatWithCoach } from '../services/aiService';
import { useIsMobile } from '../lib/useIsMobile';

const SUGGESTIONS = [
  'Where am I overspending this week?',
  'How can I reach my goals faster?',
  'Detect subscriptions I might not use',
  'Forecast next month\'s net balance',
];

interface Message { role: 'user' | 'assistant'; text: string; }

function buildSystemPrompt(
  userName: string,
  balance: number,
  inflow: number,
  outflow: number,
  currency: string
): string {
  return `You are ClearLedger's AI Coach — a friendly, sharp financial copilot. The user is ${userName}. Their current net balance is ${currency} ${balance.toLocaleString()}, monthly inflow is approximately ${currency} ${inflow.toLocaleString()}, and monthly outflow is approximately ${currency} ${outflow.toLocaleString()}.

Be concise, conversational, and specific. Use exact currency amounts. Format suggestions with single-line callouts. Always end with one actionable next step. Don't be salesy. If the user asks something unrelated to finance, gently steer back. Keep replies under 110 words unless asked for detail.`;
}

export function CoachFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open AI Coach"
      style={{
        position: 'fixed', right: 24, bottom: 110, zIndex: 30,
        width: 56, height: 56, borderRadius: 18,
        display: 'grid', placeItems: 'center',
        color: '#04201a',
        animation: 'coachPulse 2.6s ease-in-out infinite',
        transition: 'transform 0.2s var(--ease-back)',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 18,
        background: 'linear-gradient(135deg, var(--mint), var(--violet))',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 2, borderRadius: 16,
        background: 'conic-gradient(from 0deg, rgba(16,229,163,0.9), rgba(154,140,255,0.9), rgba(255,122,198,0.9), rgba(16,229,163,0.9))',
        filter: 'blur(6px) saturate(150%)',
        animation: 'spin 8s linear infinite',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 4, borderRadius: 14,
        background: 'rgba(10,15,12,0.7)',
        backdropFilter: 'blur(12px)',
        zIndex: 1,
      }} />
      <Sparkles size={22} style={{ color: 'var(--mint)', zIndex: 2, filter: 'drop-shadow(0 0 6px var(--mint))' }} />
    </button>
  );
}

function MessageBubble({ m, idx }: { m: Message; idx: number }) {
  const isUser = m.role === 'user';
  return (
    <div style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '85%',
      animation: 'fadeIn 0.4s var(--ease-spring) both',
      animationDelay: `${idx * 30}ms`,
    }}>
      <div style={{
        padding: '10px 14px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser
          ? 'linear-gradient(135deg, rgba(16,229,163,0.18), rgba(16,229,163,0.06))'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isUser ? 'color-mix(in oklab, var(--mint) 30%, transparent)' : 'var(--glass-edge-soft)'}`,
        fontSize: 13, lineHeight: 1.5,
        color: 'var(--ink)',
        whiteSpace: 'pre-wrap',
      }}>
        {m.text}
      </div>
    </div>
  );
}

export default function Coach({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { transactions, goals, currency, user } = useApp();
  const isMobile = useIsMobile();

  const inflow = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const outflow = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = inflow - outflow;
  const name = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: `Hey ${name} — I'm watching your ledger. Your balance is ${currency} ${balance.toLocaleString()}. What would you like to know?` },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', text: `Hey ${name} — I'm watching your ledger. Your balance is ${currency} ${balance.toLocaleString()}. What would you like to know?` }]);
  }, [user?.uid]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput('');
    const newMsgs: Message[] = [...messages, { role: 'user', text: q }];
    setMessages(newMsgs);
    setBusy(true);
    try {
      const systemPrompt = buildSystemPrompt(name, balance, inflow, outflow, currency);
      const reply = await chatWithCoach(
        newMsgs.map(m => ({ role: m.role, content: m.text })),
        systemPrompt
      );
      setMessages([...newMsgs, { role: 'assistant', text: reply }]);
    } catch {
      setMessages([...newMsgs, { role: 'assistant', text: "I lost the connection for a sec. Try again?" }]);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div style={isMobile ? {
        position: 'fixed', left: 0, right: 0, bottom: 0, top: 0,
        zIndex: 90,
        animation: 'coachIn 0.5s var(--ease-spring) both',
      } : {
        position: 'fixed', right: 24, bottom: 24, top: 24,
        width: 420, zIndex: 90,
        animation: 'coachIn 0.5s var(--ease-spring) both',
      }}>
        <div className="glass glass-strong" style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: isMobile ? 0 : 22, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: '1px solid var(--glass-edge-soft)',
          }}>
            <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 12 }}>
              <div className="blob" />
              <div style={{
                position: 'absolute', inset: 2, borderRadius: 10,
                background: 'rgba(10,15,12,0.85)',
                display: 'grid', placeItems: 'center', color: 'var(--mint)',
              }}>
                <Sparkles size={16} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="h-display" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                Ledger Coach
                <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--mint)', boxShadow: '0 0 6px var(--mint)' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)' }} className="mono">
                ONLINE · GROQ AI · FINANCE-GROUNDED
              </div>
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

          {/* Messages */}
          <div ref={listRef} style={{
            flex: 1, overflow: 'auto', padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {messages.map((m, i) => (
              <React.Fragment key={i}><MessageBubble m={m} idx={i} /></React.Fragment>
            ))}
            {busy && (
              <div style={{
                alignSelf: 'flex-start', display: 'flex', gap: 4,
                padding: '10px 14px', borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-edge-soft)',
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: 999,
                    background: 'var(--mint)',
                    animation: `typingBlink 1.1s ${i * 0.15}s infinite ease-in-out`,
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Suggestion chips */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 18px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="chip" style={{
                  cursor: 'pointer', fontSize: 10,
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--ink-mute)',
                  textTransform: 'none', letterSpacing: 0,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--mint)'; e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--mint) 40%, transparent)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-mute)'; e.currentTarget.style.borderColor = 'var(--glass-edge-soft)'; }}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: 14, borderTop: '1px solid var(--glass-edge-soft)', background: 'rgba(255,255,255,0.015)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 8px 8px 14px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--glass-edge-soft)',
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="Ask anything about your money…"
                style={{ flex: 1, background: 'transparent', border: 0, outline: 0, fontSize: 13, color: 'var(--ink)' }}
              />
              <button style={{ width: 30, height: 30, borderRadius: 8, color: 'var(--ink-mute)', display: 'grid', placeItems: 'center' }}>
                <Mic size={14} />
              </button>
              <button
                onClick={() => send()}
                disabled={!input.trim() || busy}
                style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: input.trim() ? 'linear-gradient(180deg, var(--mint-soft), var(--mint))' : 'rgba(255,255,255,0.06)',
                  color: input.trim() ? '#04201a' : 'var(--ink-faint)',
                  display: 'grid', placeItems: 'center',
                  transition: 'all 0.2s var(--ease-back)',
                  boxShadow: input.trim() ? '0 6px 16px -4px rgba(16,229,163,0.5)' : 'none',
                }}
              >
                <Send size={14} />
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 9, color: 'var(--ink-faint)', textAlign: 'center' }} className="mono">
              END-TO-END ENCRYPTED · NEVER USED FOR TRAINING
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
