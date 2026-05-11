import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Fingerprint, Lock, Loader2 } from 'lucide-react';
import { verifyBiometricLock } from '../lib/webauthn';
import { useWebHaptics } from 'web-haptics/react';

interface LockScreenProps {
  onUnlock: () => void;
  credentialId: string;
}

export default function LockScreen({ onUnlock, credentialId }: LockScreenProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trigger } = useWebHaptics();

  const handleUnlock = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      await verifyBiometricLock(credentialId);
      trigger('success');
      onUnlock();
    } catch (err: any) {
      console.error('Biometric unlock failed:', err);
      trigger('error');
      setError('Authentication failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    handleUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#050505',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `env(safe-area-inset-top, 24px) env(safe-area-inset-right, 24px) env(safe-area-inset-bottom, 24px) env(safe-area-inset-left, 24px)`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow — capped so it never overflows on small screens */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(520px, 90vw)',
        height: 'min(520px, 90vw)',
        background: 'rgba(16,229,163,0.05)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 360,
          padding: 'clamp(24px, 6vw, 36px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center',
        }}
        className="glass-panel"
      >
        {/* Icon */}
        <div style={{
          width: 'clamp(72px, 20vw, 88px)',
          height: 'clamp(72px, 20vw, 88px)',
          borderRadius: '50%',
          background: 'rgba(16,229,163,0.08)',
          border: '1px solid rgba(16,229,163,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 'clamp(20px, 5vw, 28px)',
          position: 'relative',
          flexShrink: 0,
        }}>
          <Shield style={{ width: '45%', height: '45%', color: 'var(--mint)' }} />
          <div style={{
            position: 'absolute', inset: 0,
            border: '1px solid rgba(16,229,163,0.30)',
            borderRadius: '50%',
            animation: 'ping 1.8s cubic-bezier(0,0,0.2,1) infinite',
            opacity: 0.2,
          }} />
        </div>

        <h1 style={{
          fontSize: 'clamp(20px, 5.5vw, 24px)',
          fontWeight: 700, color: '#fff',
          letterSpacing: '-0.01em',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}>App Locked</h1>

        <p style={{
          fontSize: 10, color: 'var(--ink-faint)',
          fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.18em',
          marginBottom: error ? 20 : 'clamp(24px, 6vw, 32px)',
        }}>
          Biometric verification required
        </p>

        {error && (
          <div style={{
            marginBottom: 'clamp(18px, 5vw, 24px)',
            padding: '10px 16px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.20)',
            borderRadius: 12, width: '100%',
          }}>
            <p style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>{error}</p>
          </div>
        )}

        <button
          onClick={() => { trigger('medium'); handleUnlock(); }}
          disabled={isVerifying}
          style={{
            width: '100%',
            padding: 'clamp(14px, 4vw, 18px) 24px',
            background: 'linear-gradient(180deg, var(--mint-soft), var(--mint))',
            color: '#04201a',
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 'clamp(14px, 4vw, 15px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
            boxShadow: '0 0 28px rgba(16,229,163,0.22)',
            opacity: isVerifying ? 0.7 : 1,
            cursor: isVerifying ? 'not-allowed' : 'pointer',
            touchAction: 'manipulation',
          }}
          onMouseEnter={e => { if (!isVerifying) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'; }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          {isVerifying
            ? <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
            : <><Fingerprint style={{ width: 20, height: 20 }} /> Unlock App</>
          }
        </button>

        <div style={{
          marginTop: 'clamp(20px, 5vw, 28px)',
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.22)',
        }}>
          <Lock style={{ width: 11, height: 11 }} />
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 500 }}>
            Secured Locally
          </span>
        </div>
      </motion.div>
    </div>
  );
}
