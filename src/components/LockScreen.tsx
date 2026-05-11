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

  // Attempt to unlock automatically on mount
  useEffect(() => {
    handleUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-sm w-full glass-panel p-8 flex flex-col items-center text-center border border-white/5"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 relative">
          <Shield className="w-10 h-10 text-emerald-500" />
          <div className="absolute inset-0 border border-emerald-500/30 rounded-full animate-ping opacity-20" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-2 uppercase">App Locked</h1>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-8">
          Biometric verification required
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl w-full">
            <p className="text-xs text-rose-500 text-center">{error}</p>
          </div>
        )}

        <button
          onClick={() => {
            trigger('medium');
            handleUnlock();
          }}
          disabled={isVerifying}
          className="w-full py-4 px-6 bg-emerald-500 text-black rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
        >
          {isVerifying ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Fingerprint className="w-5 h-5" />
              Unlock App
            </>
          )}
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-white/30">
          <Lock className="w-3 h-3" />
          <span className="text-[9px] uppercase tracking-widest font-medium">Secured Locally</span>
        </div>
      </motion.div>
    </div>
  );
}
