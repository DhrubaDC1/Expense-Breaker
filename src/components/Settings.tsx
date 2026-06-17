import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Sparkles, Brain, Bell, Mic, Camera, Globe, Lock, ShieldCheck, LogOut, Fingerprint, Check, X, Layers, Users, Zap, Copy, Trash2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { useToast } from '../ToastContext';
import { GlassCard } from './ui';
import { EXCHANGE_RATES } from '../constants';
import { isBiometricAvailable, registerBiometricLock } from '../lib/webauthn';
import { useIsMobile } from '../lib/useIsMobile';

type Modal = 'biometric' | 'appearance' | 'hermes' | null;

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
  onClick,
}: {
  Icon: React.ElementType;
  title: string;
  value?: string;
  children?: React.ReactNode;
  accent?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderBottom: '1px solid var(--glass-edge-soft)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.2s',
      }}
      onMouseEnter={onClick ? e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)') : undefined}
      onMouseLeave={onClick ? e => (e.currentTarget.style.background = 'transparent') : undefined}
    >
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

export default function Settings({ contentPad = '0 32px' }: { contentPad?: string }) {
  const { user, currency, setCurrency, signOut, apiTokenMeta, generateApiToken, revokeApiToken } = useApp();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [noTransparency, setNoTransparency] = useState(() => localStorage.getItem('no-transparency') === '1');
  const [hideSpaces, setHideSpaces] = useState(() => localStorage.getItem('hide-spaces') === '1');

  const handleHideSpaces = (v: boolean) => {
    setHideSpaces(v);
    if (v) {
      localStorage.setItem('hide-spaces', '1');
    } else {
      localStorage.removeItem('hide-spaces');
    }
    window.dispatchEvent(new CustomEvent('hide-spaces-change', { detail: v }));
  };

  const handleNoTransparency = (v: boolean) => {
    setNoTransparency(v);
    if (v) {
      localStorage.setItem('no-transparency', '1');
      document.documentElement.classList.add('no-transparency');
    } else {
      localStorage.removeItem('no-transparency');
      document.documentElement.classList.remove('no-transparency');
    }
  };

  const [aiAuto, setAiAuto] = useState(true);
  const [aiCoach, setAiCoach] = useState(true);
  const [aiAnomaly, setAiAnomaly] = useState(true);
  const [voice, setVoice] = useState(false);
  const [notif, setNotif] = useState(false);

  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [biometricCredential, setBiometricCredential] = useState<string | null>(
    () => localStorage.getItem('biometric_lock_credential')
  );
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const [hermesToken, setHermesToken] = useState<string | null>(null);
  const [hermesLoading, setHermesLoading] = useState(false);
  const [hermesConfirm, setHermesConfirm] = useState<'generate' | 'revoke' | null>(null);

  useEffect(() => {
    isBiometricAvailable().then(setIsBiometricSupported);
  }, []);

  const handleToggleBiometric = async () => {
    if (biometricCredential) {
      localStorage.removeItem('biometric_lock_credential');
      setBiometricCredential(null);
      toast('Biometric lock disabled', 'success');
      setActiveModal(null);
    } else {
      try {
        const credentialId = await registerBiometricLock();
        localStorage.setItem('biometric_lock_credential', credentialId);
        setBiometricCredential(credentialId);
        toast('Biometric lock enabled — app will lock on next load', 'success');
        setActiveModal(null);
      } catch (err: any) {
        toast(err.message || 'Failed to setup biometric lock', 'error');
      }
    }
  };

  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?';

  return (
    <div style={{ padding: contentPad, maxWidth: 880, margin: '0 auto' }}>
      {/* Profile card */}
      <GlassCard className="view-enter" style={{ padding: 30, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
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
            <div className="h-display" style={{ fontSize: isMobile ? 22 : 28 }}>
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
          <button className="btn" onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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
            onChange={e => { setCurrency(e.target.value); toast(`Currency set to ${e.target.value}`, 'success'); }}
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
        <Row Icon={Sparkles} title="Appearance" value="Glass Dark ›" onClick={() => setActiveModal('appearance')} />
        <Row Icon={Layers} title="Disable Transparency">
          <Toggle on={noTransparency} onChange={handleNoTransparency} />
        </Row>
        <Row Icon={Users} title="Disable Spaces">
          <Toggle on={hideSpaces} onChange={handleHideSpaces} />
        </Row>
        <Row Icon={Bell} title="Notifications">
          <Toggle on={notif} onChange={setNotif} />
        </Row>
      </GlassCard>

      {/* Hermes API */}
      <GlassCard className="view-enter" style={{ padding: 4, marginBottom: 16, animationDelay: '180ms' }}>
        <div className="label-text" style={{ padding: '12px 16px 0' }}>Hermes API</div>
        <Row
          Icon={Zap}
          accent="#9A8CFF"
          title="External API Token"
          value={apiTokenMeta ? `Active since ${new Date(apiTokenMeta.createdAt).toLocaleDateString()} ›` : 'No active token ›'}
          onClick={() => setActiveModal('hermes')}
        />
      </GlassCard>

      {/* Security */}
      <GlassCard className="view-enter" style={{ padding: 4, animationDelay: '240ms' }}>
        <div className="label-text" style={{ padding: '12px 16px 0' }}>Security</div>
        <Row
          Icon={Lock}
          title="Biometric Lock"
          value={biometricCredential ? 'Enabled ›' : 'Disabled ›'}
          accent={biometricCredential ? 'var(--mint)' : undefined}
          onClick={() => setActiveModal('biometric')}
        />
        <Row Icon={ShieldCheck} title="Note Encryption" value="AES-GCM 256 ›" />
        <Row Icon={Globe} title="Cloud Sync" value="Firebase Active ›" />
      </GlassCard>

      {/* Hermes API modal */}
      {activeModal === 'hermes' && ReactDOM.createPortal(
        <>
          <div className="scrim" onClick={() => { setActiveModal(null); setHermesToken(null); setHermesConfirm(null); }} />
          <div className="log-entry-modal">
            <GlassCard strong className="log-entry-card">
              <div className="log-entry-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div className="h-display" style={{ fontSize: 20 }}>Hermes API</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>External agent access</div>
                  </div>
                  <button onClick={() => { setActiveModal(null); setHermesToken(null); setHermesConfirm(null); }} style={{ color: 'var(--ink-mute)', padding: 4 }}><X size={16} /></button>
                </div>

                {/* One-time token display */}
                {hermesToken && (
                  <div style={{ marginBottom: 20, padding: 14, borderRadius: 12, background: 'color-mix(in oklab, var(--mint) 6%, transparent)', border: '1px solid color-mix(in oklab, var(--mint) 25%, transparent)' }}>
                    <div style={{ fontSize: 11, color: 'var(--mint)', marginBottom: 8, fontWeight: 600 }}>Copy this token — it will not be shown again</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ flex: 1, fontSize: 11, wordBreak: 'break-all', color: 'var(--ink)', lineHeight: 1.5 }}>{hermesToken}</code>
                      <button
                        className="btn"
                        style={{ flexShrink: 0 }}
                        onClick={() => { navigator.clipboard.writeText(hermesToken); toast('Token copied', 'success'); }}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 20, lineHeight: 1.6 }}>
                  {apiTokenMeta
                    ? `Token active since ${new Date(apiTokenMeta.createdAt).toLocaleString()}. Generating a new token will invalidate the current one.`
                    : 'Generate a token to allow Hermes and other external agents to read and write your expenses via the REST API.'}
                </div>

                {/* Confirm prompt */}
                {hermesConfirm && (
                  <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)', fontSize: 12, color: '#fdba74', lineHeight: 1.6 }}>
                    {hermesConfirm === 'generate'
                      ? 'This will invalidate any existing token. The new token is shown once. Continue?'
                      : 'This will permanently revoke access for all agents using the current token. Continue?'}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary" style={{ flex: 1 }} disabled={hermesLoading} onClick={async () => {
                        setHermesLoading(true);
                        try {
                          if (hermesConfirm === 'generate') {
                            const tok = await generateApiToken();
                            setHermesToken(tok);
                            toast('API token generated', 'success');
                          } else {
                            await revokeApiToken();
                            setHermesToken(null);
                            toast('API token revoked', 'success');
                          }
                        } catch { toast('Operation failed', 'error'); }
                        setHermesConfirm(null);
                        setHermesLoading(false);
                      }}>
                        {hermesLoading ? 'Working…' : 'Confirm'}
                      </button>
                      <button className="btn" style={{ flex: 1 }} onClick={() => setHermesConfirm(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {!hermesConfirm && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setHermesConfirm('generate')}>
                      {apiTokenMeta ? 'Regenerate Token' : 'Generate API Token'}
                    </button>
                    {apiTokenMeta && (
                      <button className="btn" style={{ flexShrink: 0, color: '#f87171' }} onClick={() => setHermesConfirm('revoke')}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* curl example */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 8, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>How to use</div>
                  <pre style={{ fontSize: 11, lineHeight: 1.6, color: '#a7f3d0', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 12, overflowX: 'auto', whiteSpace: 'pre' }}>{`TOKEN="clg_live_<your-token>"
BASE="https://expense-breaker.vercel.app"

curl -H "Authorization: Bearer $TOKEN" $BASE/api/v1/me
curl "$BASE/api/v1/expenses?limit=20" -H "Authorization: Bearer $TOKEN"
curl -X POST $BASE/api/v1/expenses \\
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \\
  -d '{"amount":350,"currency":"BDT","category_id":"1","occurred_at":"${new Date().toISOString()}"}'`}</pre>
                </div>
              </div>
            </GlassCard>
          </div>
        </>,
        document.body
      )}

      {/* Biometric modal */}
      {activeModal === 'biometric' && ReactDOM.createPortal(
        <>
          <div className="scrim" onClick={() => setActiveModal(null)} />
          <div className="log-entry-modal">
            <GlassCard strong className="log-entry-card">
              <div className="log-entry-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div className="h-display" style={{ fontSize: 20 }}>Biometric Lock</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>Device authentication</div>
                  </div>
                  <button onClick={() => setActiveModal(null)} style={{ color: 'var(--ink-mute)', padding: 4 }}><X size={16} /></button>
                </div>

                <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                    background: 'color-mix(in oklab, var(--mint) 10%, transparent)',
                    border: '1px solid color-mix(in oklab, var(--mint) 30%, transparent)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Fingerprint size={28} style={{ color: 'var(--mint)' }} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-mute)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
                    Secure your app using your device's built-in biometric authentication (Face ID, Touch ID, or PIN). Lock activates on next app load.
                  </div>
                </div>

                {!isBiometricSupported ? (
                  <div style={{
                    padding: 14, borderRadius: 12, textAlign: 'center',
                    background: 'rgba(255,100,100,0.06)',
                    border: '1px solid rgba(255,100,100,0.2)',
                    fontSize: 12, color: '#FF9A9A',
                  }}>
                    Biometric authentication is not available on this device or browser.
                  </div>
                ) : (
                  <button
                    onClick={handleToggleBiometric}
                    className="btn btn-primary"
                    style={{
                      width: '100%', marginTop: 4,
                      background: biometricCredential
                        ? 'linear-gradient(180deg, rgba(255,100,100,0.3), rgba(255,80,80,0.2))'
                        : undefined,
                      color: biometricCredential ? '#FF9A9A' : undefined,
                      boxShadow: biometricCredential ? '0 6px 16px -4px rgba(255,80,80,0.3)' : undefined,
                    }}
                  >
                    {biometricCredential ? 'Disable Biometric Lock' : 'Enable Biometric Lock'}
                  </button>
                )}
              </div>
            </GlassCard>
          </div>
        </>,
        document.body
      )}

      {/* Appearance modal */}
      {activeModal === 'appearance' && ReactDOM.createPortal(
        <>
          <div className="scrim" onClick={() => setActiveModal(null)} />
          <div className="log-entry-modal">
            <GlassCard strong className="log-entry-card">
            <div className="log-entry-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div className="h-display" style={{ fontSize: 20 }}>Appearance</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>Display theme</div>
                </div>
                <button onClick={() => setActiveModal(null)} style={{ color: 'var(--ink-mute)', padding: 4 }}><X size={16} /></button>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {/* Active: Glass Dark */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 14,
                  background: 'color-mix(in oklab, var(--mint) 8%, transparent)',
                  border: '1px solid color-mix(in oklab, var(--mint) 30%, transparent)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#050805', border: '1px solid rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Glass Dark</span>
                  </div>
                  <Check size={15} style={{ color: 'var(--mint)' }} />
                </div>
                {/* Coming soon: Light */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-edge-soft)',
                  opacity: 0.4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f5f5f0', border: '1px solid rgba(0,0,0,0.1)' }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Light</span>
                  </div>
                  <span className="label-text" style={{ fontSize: 9 }}>SOON</span>
                </div>
              </div>
            </div>
            </GlassCard>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
