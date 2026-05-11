import React, { useState } from 'react';
import { Sparkles, Brain, Bell, Mic, Camera, Globe, Lock, ShieldCheck, LogOut } from 'lucide-react';
import { useApp } from '../AppContext';
import { GlassCard } from './ui';
import { EXCHANGE_RATES } from '../constants';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 38, height: 22, borderRadius: 999,
        background: on ? 'color-mix(in oklab, var(--mint) 50%, transparent)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${on ? 'color-mix(in oklab, var(--mint) 60%, transparent)' : 'var(--glass-edge-soft)'}`,
        position: 'relative',
        transition: 'background 0.3s var(--ease-soft), border-color 0.3s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: 999,
        background: on ? 'var(--mint)' : 'rgba(255,255,255,0.4)',
        transition: 'left 0.3s var(--ease-back)',
        boxShadow: on ? '0 0 10px var(--mint)' : 'none',
      }} />
    </button>
  );
}

function Row({
  Icon,
  title,
  value,
  children,
  accent,
}: {
  Icon: React.ElementType;
  title: string;
  value?: string;
  children?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      borderBottom: '1px solid var(--glass-edge-soft)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: accent ? `color-mix(in oklab, ${accent} 14%, transparent)` : 'rgba(255,255,255,0.04)',
        color: accent || 'var(--ink-mute)',
        display: 'grid', placeItems: 'center',
      }}>
        <Icon size={15} />
      </div>
      <div style={{ flex: 1, fontSize: 13 }}>{title}</div>
      {children || <div style={{ fontSize: 12, color: 'var(--ink-mute)' }} className="mono">{value}</div>}
    </div>
  );
}

export default function Settings() {
  const { user, currency, setCurrency, signOut } = useApp();
  const [aiAuto, setAiAuto] = useState(true);
  const [aiCoach, setAiCoach] = useState(true);
  const [aiAnomaly, setAiAnomaly] = useState(true);
  const [voice, setVoice] = useState(false);
  const [notif, setNotif] = useState(false);

  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?';

  return (
    <div style={{ padding: '0 32px', maxWidth: 880, margin: '0 auto' }}>
      {/* Profile card */}
      <GlassCard className="view-enter" style={{ padding: 30, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #10E5A3, #9A8CFF, #FF7AC6, #10E5A3)',
            padding: 2, flexShrink: 0,
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: 'var(--bg-1)', display: 'grid', placeItems: 'center',
              fontSize: 24, fontWeight: 600, color: 'var(--mint)',
            }}>
              {user?.photoURL
                ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : initial.toUpperCase()
              }
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="h-display" style={{ fontSize: 28 }}>
              {user?.displayName || user?.email?.split('@')[0]}
            </div>
            <div style={{ color: 'var(--ink-mute)', fontSize: 12 }}>
              {user?.email} · {currency} default
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <span className="chip chip-mint">Pro</span>
              <span className="chip">ClearLedger</span>
            </div>
          </div>
          <button className="btn" onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </GlassCard>

      {/* AI section */}
      <GlassCard className="view-enter" style={{ padding: 4, marginBottom: 16, animationDelay: '60ms' }}>
        <div className="label-text" style={{ padding: '12px 16px 0' }}>AI & Intelligence</div>
        <Row Icon={Sparkles} accent="var(--mint)" title="Auto-categorization">
          <Toggle on={aiAuto} onChange={setAiAuto} />
        </Row>
        <Row Icon={Brain} accent="#BFB5FF" title="AI Coach proactive nudges">
          <Toggle on={aiCoach} onChange={setAiCoach} />
        </Row>
        <Row Icon={Bell} accent="var(--amber)" title="Anomaly detection alerts">
          <Toggle on={aiAnomaly} onChange={setAiAnomaly} />
        </Row>
        <Row Icon={Mic} accent="#FF7AC6" title="Voice input ('say to log')">
          <Toggle on={voice} onChange={setVoice} />
        </Row>
        <Row Icon={Camera} accent="#7BD9E0" title="Receipt OCR — auto-import">
          <Toggle on={true} onChange={() => {}} />
        </Row>
      </GlassCard>

      {/* Preferences */}
      <GlassCard className="view-enter" style={{ padding: 4, marginBottom: 16, animationDelay: '120ms' }}>
        <div className="label-text" style={{ padding: '12px 16px 0' }}>Preferences</div>
        <Row Icon={Globe} title="Default Currency">
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-edge-soft)',
              borderRadius: 8, padding: '4px 8px', color: 'var(--ink)', fontSize: 12, outline: 0,
            }}
          >
            {Object.keys(EXCHANGE_RATES).map(c => (
              <option key={c} value={c} style={{ background: '#0a0f0c' }}>{c}</option>
            ))}
          </select>
        </Row>
        <Row Icon={Sparkles} title="Appearance" value="Glass Dark ›" />
        <Row Icon={Bell} title="Notifications">
          <Toggle on={notif} onChange={setNotif} />
        </Row>
      </GlassCard>

      {/* Security */}
      <GlassCard className="view-enter" style={{ padding: 4, animationDelay: '180ms' }}>
        <div className="label-text" style={{ padding: '12px 16px 0' }}>Security</div>
        <Row Icon={Lock} title="Biometric Lock" value={localStorage.getItem('biometric_lock_credential') ? 'Enabled ›' : 'Disabled ›'} />
        <Row Icon={ShieldCheck} title="Note Encryption" value="AES-GCM 256 ›" />
        <Row Icon={Globe} title="Cloud Sync" value="Firebase Active ›" />
      </GlassCard>
    </div>
  );
}
