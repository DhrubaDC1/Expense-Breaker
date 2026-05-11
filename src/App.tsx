import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './AppContext';
import { ToastProvider } from './ToastContext';
import {
  LayoutDashboard, Clock, Target, Users, Settings as SettingsIcon,
  Plus, Search, Bell, Sparkles, LogOut,
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import SettingsPage from './components/Settings';
import AddTransactionModal from './components/AddTransactionModal';
import Login from './components/Login';
import SharedSpaces from './components/SharedSpaces';
import LockScreen from './components/LockScreen';
import Coach, { CoachFAB } from './components/Coach';

import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';
import { useIsMobile } from './lib/useIsMobile';

type Tab = 'dashboard' | 'activity' | 'goals' | 'spaces' | 'settings';

const DOCK_TABS: Array<{ id: Tab; Icon: typeof LayoutDashboard; label: string }> = [
  { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'activity',  Icon: Clock,           label: 'Activity'  },
  { id: 'goals',     Icon: Target,          label: 'Goals'     },
  { id: 'spaces',    Icon: Users,           label: 'Spaces'    },
  { id: 'settings',  Icon: SettingsIcon,    label: 'Settings'  },
];

const Logo = () => (
  <div style={{
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(160deg, #15F0AE 0%, #0AB382 100%)',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 8px 20px -6px rgba(16,229,163,0.55), inset 0 1px 0 rgba(255,255,255,0.4)',
  }}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#04201a" strokeWidth="2.2" strokeLinejoin="round">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" fill="rgba(4,32,26,0.15)" />
      <path d="M8 12l3 3 5-6" strokeLinecap="round" />
    </svg>
  </div>
);

function TopBar({ onCoach, onSignOut }: { onCoach: () => void; onSignOut: () => void }) {
  const { user } = useApp();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', position: 'relative', zIndex: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <div className="h-display" style={{ fontSize: 16 }}>ClearLedger</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onCoach} style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--glass-edge-soft)',
            display: 'grid', placeItems: 'center',
            color: 'var(--ink-mute)',
          }}>
            <Search size={15} />
          </button>
          <button onClick={onCoach} style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--glass-edge-soft)',
            display: 'grid', placeItems: 'center',
            color: 'var(--violet)',
            position: 'relative',
          }}>
            <Sparkles size={15} />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 999, background: 'var(--mint)', boxShadow: '0 0 6px var(--mint)' }} />
          </button>
          <button onClick={onSignOut} style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--glass-edge-soft)',
            display: 'grid', placeItems: 'center',
            color: 'var(--ink-mute)',
          }}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 32px', position: 'relative', zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Logo />
        <div>
          <div className="h-display" style={{ fontSize: 18 }}>ClearLedger</div>
          <div className="label-text" style={{ fontSize: 9, marginTop: 2 }}>Operational Platform · Liquid</div>
        </div>
        <div style={{ width: 1, height: 26, background: 'var(--glass-edge-soft)', margin: '0 8px' }} />
        <button onClick={onCoach} className="glass-spec" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px 8px 12px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--glass-edge-soft)',
          color: 'var(--ink-mute)', fontSize: 12,
          minWidth: 260,
        }}>
          <Search size={14} />
          <span style={{ flex: 1, textAlign: 'left' }}>Ask anything about your finances…</span>
          <kbd style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-edge-soft)' }}>⌘K</kbd>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="chip chip-mint" style={{ fontSize: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--mint)', boxShadow: '0 0 8px var(--mint)' }} />
          Live Sync
        </div>
        <button className="glass-spec" style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-edge-soft)', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)' }}>
          <Bell size={16} />
        </button>
        <button onClick={onCoach} className="glass-spec" style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-edge-soft)', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)' }}>
          <div style={{ position: 'relative' }}>
            <Sparkles size={16} />
            <span style={{ position: 'absolute', top: -4, right: -5, width: 7, height: 7, borderRadius: 999, background: 'var(--mint)', boxShadow: '0 0 6px var(--mint)' }} />
          </div>
        </button>
        <div style={{ width: 1, height: 26, background: 'var(--glass-edge-soft)', margin: '0 4px' }} />
        <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.4 }}>
          <div style={{ color: 'var(--ink-mute)' }}>{user?.email}</div>
          <div className="mono" style={{ color: 'var(--mint)', letterSpacing: '0.06em', fontSize: 10 }}>● ACTIVE SESSION</div>
        </div>
        <button onClick={onSignOut} className="glass-spec" style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-edge-soft)', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)' }}>
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}

function Dock({ tab, setTab, onAdd, onCoach }: {
  tab: Tab; setTab: (t: Tab) => void; onAdd: () => void; onCoach: () => void;
}) {
  const { trigger } = useWebHaptics();
  const isMobile = useIsMobile();
  const idx = DOCK_TABS.findIndex(t => t.id === tab);

  if (isMobile) {
    // Full-width bottom bar on mobile
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        padding: '0 8px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        background: 'rgba(8, 12, 10, 0.7)',
        borderTop: '1px solid var(--glass-edge)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 4, padding: '6px 0' }}>
          {DOCK_TABS.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => { if (id !== tab) trigger('selection'); setTab(id); }}
              aria-label={label}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 4px',
                color: id === tab ? 'var(--mint)' : 'var(--ink-faint)',
                borderRadius: 12,
                background: id === tab ? 'rgba(16,229,163,0.08)' : 'transparent',
                transition: 'color 0.2s, background 0.2s',
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
            </button>
          ))}
          <button
            onClick={() => { trigger('medium'); onAdd(); }}
            aria-label="Add transaction"
            style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(180deg, #1AF2B0, #0AB382)',
              color: '#04201a', display: 'grid', placeItems: 'center',
              boxShadow: '0 8px 20px -6px rgba(16,229,163,0.65)',
            }}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', zIndex: 40 }}>
      <div className="dock">
        <div className="dock-indicator" style={{ left: 8 + idx * 46, width: 42 }} />
        {DOCK_TABS.map(({ id, Icon, label }) => (
          <button
            key={id}
            className={`dock-btn${id === tab ? ' active' : ''}`}
            onClick={() => { if (id !== tab) trigger('selection'); setTab(id); }}
            aria-label={label}
            style={{ color: id === tab ? 'var(--mint)' : 'var(--ink-mute)' }}
          >
            <Icon size={18} />
            <span style={{
              position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)',
              fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: id === tab ? 'var(--mint)' : 'transparent',
              transition: 'color 0.3s var(--ease-soft)',
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>{label}</span>
          </button>
        ))}
        <div style={{ width: 1, height: 26, background: 'var(--glass-edge)', margin: '0 4px' }} />
        <button className="dock-btn" onClick={onCoach} aria-label="AI Coach" style={{ color: 'var(--violet)' }}>
          <Sparkles size={18} />
        </button>
        <button
          onClick={() => { trigger('medium'); onAdd(); }}
          aria-label="Add transaction"
          style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(180deg, #1AF2B0, #0AB382)',
            color: '#04201a', display: 'grid', placeItems: 'center',
            boxShadow: '0 10px 24px -6px rgba(16,229,163,0.65), inset 0 1px 0 rgba(255,255,255,0.45)',
            transition: 'transform 0.2s var(--ease-back)',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [addOpen, setAddOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const { user, isAuthLoading, signOut } = useApp();
  const isMobile = useIsMobile();

  const [biometricCredential] = useState<string | null>(() => localStorage.getItem('biometric_lock_credential'));
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCoachOpen(true); }
      if (e.key === 'Escape') { setCoachOpen(false); setAddOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (biometricCredential && !isUnlocked) {
    return <LockScreen credentialId={biometricCredential} onUnlock={() => setIsUnlocked(true)} />;
  }

  if (isAuthLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-0)', display: 'grid', placeItems: 'center' }}>
        <Loader2 size={32} style={{ color: 'var(--mint)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) return <Login />;

  const contentPad = isMobile ? '0 12px' : '0 32px';
  /* Extra bottom padding so content clears the dock */
  const bottomPad = isMobile ? 90 : 140;

  return (
    <>
      <div className="mesh" aria-hidden="true">
        <div className="orb-3" />
        <div className="grain" />
        <div className="mesh-veil" />
      </div>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <TopBar onCoach={() => setCoachOpen(true)} onSignOut={signOut} />

        <main style={{ paddingBottom: bottomPad }}>
          <AnimatePresence mode="wait">
            {tab === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <Dashboard onCoach={() => setCoachOpen(true)} contentPad={contentPad} />
              </motion.div>
            )}
            {tab === 'activity' && (
              <motion.div key="act" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <Transactions contentPad={contentPad} />
              </motion.div>
            )}
            {tab === 'goals' && (
              <motion.div key="goals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <Goals contentPad={contentPad} />
              </motion.div>
            )}
            {tab === 'spaces' && (
              <motion.div key="spaces" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <SharedSpaces contentPad={contentPad} />
              </motion.div>
            )}
            {tab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <SettingsPage contentPad={contentPad} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {!isMobile && <CoachFAB onClick={() => setCoachOpen(true)} />}
        <Dock tab={tab} setTab={setTab} onAdd={() => setAddOpen(true)} onCoach={() => setCoachOpen(true)} />
        <Coach open={coachOpen} onClose={() => setCoachOpen(false)} />
        <AddTransactionModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}
