import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, LogIn, ChevronRight, Globe, Lock } from 'lucide-react';
import { useApp } from '../AppContext';

export default function Login() {
  const { signIn, isAuthLoading } = useApp();

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20"
          >
            <Shield className="w-8 h-8 text-emerald-500" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white uppercase tracking-tighter mb-2">ClearLedger</h1>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.3em]">Institutional Grade Finance</p>
        </div>

        <div className="glass-panel p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
               <div className="p-2 bg-white/5 rounded-lg">
                 <Lock className="w-4 h-4 text-emerald-500" />
               </div>
               <div>
                 <p className="text-xs font-bold text-white">Client-Side Encryption</p>
                 <p className="text-[10px] text-gray-600 leading-relaxed uppercase tracking-wider mt-1">Your data is encrypted before it ever touches our servers.</p>
               </div>
            </div>
            <div className="flex items-start gap-4">
               <div className="p-2 bg-white/5 rounded-lg">
                 <Globe className="w-4 h-4 text-emerald-500" />
               </div>
               <div>
                 <p className="text-xs font-bold text-white">Real-Time Ledger Sync</p>
                 <p className="text-[10px] text-gray-600 leading-relaxed uppercase tracking-wider mt-1">Instant synchronization across all authorized session nodes.</p>
               </div>
            </div>
          </div>

          <button
            onClick={() => signIn()}
            disabled={isAuthLoading}
            className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            {isAuthLoading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <LogIn className="w-4 h-4" />
              </motion.div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Initialize Secure Tunnel</span>
              </>
            )}
          </button>

          <p className="text-center text-[9px] text-gray-700 uppercase font-bold tracking-widest">
            By proceeding, you agree to our Protocol Terms
          </p>
        </div>
      </motion.div>
    </div>
  );
}
