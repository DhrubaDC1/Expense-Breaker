import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { useToast } from '../ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, Shield, Database, Globe, Moon, User, LogOut,
  ChevronRight, Cpu, Smartphone, Cloud, X, Check, Lock, Fingerprint
} from 'lucide-react';
import { EXCHANGE_RATES } from '../constants';
import { isBiometricAvailable, registerBiometricLock } from '../lib/webauthn';

type Modal = 'appearance' | 'currency' | 'encryption' | 'ai' | 'biometric' | null;

const CURRENCIES = Object.keys(EXCHANGE_RATES) as string[];

export default function Settings() {
  const { user, currency, setCurrency, signOut } = useApp();
  const { toast } = useToast();
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unavailable'>(
    'Notification' in window ? Notification.permission : 'unavailable'
  );

  const handleNotifications = async () => {
    if (notifPermission === 'unavailable') {
      toast('Notifications are not supported in this browser', 'error');
      return;
    }
    if (notifPermission === 'granted') {
      toast('To disable notifications, use your browser site settings', 'info');
      return;
    }
    if (notifPermission === 'denied') {
      toast('Notifications blocked — enable them in your browser settings', 'error');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      new Notification('ClearLedger', { body: 'Notifications are now enabled.' });
      toast('Notifications enabled', 'success');
    } else {
      toast('Notification permission denied', 'error');
    }
  };

  const handleCloudSync = () => {
    toast('Real-time sync is active via Firebase Firestore', 'info');
  };

  const [biometricCredential, setBiometricCredential] = useState<string | null>(
    localStorage.getItem('biometric_lock_credential')
  );

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  React.useEffect(() => {
    isBiometricAvailable().then(setIsBiometricSupported);
  }, []);

  const handleToggleBiometric = async () => {
    if (biometricCredential) {
      // Disable
      localStorage.removeItem('biometric_lock_credential');
      setBiometricCredential(null);
      toast('Biometric lock disabled', 'success');
    } else {
      // Enable
      try {
        const credentialId = await registerBiometricLock();
        localStorage.setItem('biometric_lock_credential', credentialId);
        setBiometricCredential(credentialId);
        toast('Biometric lock enabled', 'success');
      } catch (err: any) {
        console.error(err);
        toast(err.message || 'Failed to setup biometric lock', 'error');
      }
    }
  };

  const notifLabel = notifPermission === 'granted' ? 'Enabled' : notifPermission === 'denied' ? 'Blocked' : 'Off';
  const biometricLabel = biometricCredential ? 'Enabled' : 'Off';

  const sections = [
    {
      title: 'Preferences',
      items: [
        { icon: Globe, label: 'Default Currency', value: currency, action: () => setActiveModal('currency') },
        { icon: Moon, label: 'Appearance', value: 'Glass Dark', action: () => setActiveModal('appearance') },
        { icon: Bell, label: 'Notifications', value: notifLabel, action: handleNotifications },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: Shield, label: 'Biometric Lock', value: biometricLabel, action: () => setActiveModal('biometric') },
        { icon: Database, label: 'Local Encryption', value: 'AES-GCM 256', action: () => setActiveModal('encryption') },
        { icon: Cloud, label: 'Cloud Sync', value: 'Active', action: handleCloudSync },
      ],
    },
    {
      title: 'System',
      items: [
        { icon: Cpu, label: 'AI Processor', value: 'Llama 4 Scout', action: () => setActiveModal('ai') },
        { icon: Smartphone, label: 'Application Version', value: '1.0.0 (Release)', action: () => {} },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="flex items-center gap-6 pb-8 border-b border-white/5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-1 shrink-0">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : <User className="w-10 h-10 text-white/40" />}
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold truncate">{user?.displayName ?? 'Account'}</h2>
          <p className="text-sm text-white/40 font-mono mt-1 truncate">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/20 px-2">{section.title}</h3>
            <div className="glass-card divide-y divide-white/5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-white/5 text-white/40 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/30 font-mono">{item.value}</span>
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => signOut()}
        className="w-full py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold uppercase tracking-[0.2em] text-xs hover:bg-rose-500/20 transition-all flex items-center justify-center gap-3"
      >
        <LogOut className="w-4 h-4" />
        Sign Out Session
      </button>

      <div className="pt-12 text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-medium">ClearLedger Financial Systems</p>
        <p className="text-[8px] text-white/10 uppercase tracking-[0.2em] mt-2">© 2026 • Secure & Private</p>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm glass-panel p-8 space-y-6"
            >
              <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>

              {activeModal === 'currency' && (
                <>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-tight">Default Currency</h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Select your primary unit</p>
                  </div>
                  <div className="space-y-2">
                    {CURRENCIES.map(c => (
                      <button
                        key={c}
                        onClick={() => { setCurrency(c); setActiveModal(null); toast(`Currency set to ${c}`, 'success'); }}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 transition-all"
                      >
                        <span className="font-mono font-bold text-sm text-white">{c}</span>
                        {currency === c && <Check className="w-4 h-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {activeModal === 'appearance' && (
                <>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-tight">Appearance</h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Display theme</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-emerald-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#050505] border border-white/20" />
                        <span className="text-sm font-medium text-white">Glass Dark</span>
                      </div>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 opacity-40 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300" />
                        <span className="text-sm font-medium text-white">Light</span>
                      </div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Soon</span>
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'encryption' && (
                <>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-tight">Local Encryption</h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Data protection protocol</p>
                  </div>
                  <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-2">Active</p>
                      <p className="font-mono text-white font-bold">AES-GCM 256-bit</p>
                    </div>
                    <p>Transaction notes are encrypted client-side using the Web Crypto SubtleCrypto API before being stored in Firestore. A unique 12-byte IV is generated per record.</p>
                    <p className="text-[10px] text-gray-600 font-mono">Key derivation: userId → 32-byte AES-GCM key</p>
                  </div>
                </>
              )}

              {activeModal === 'ai' && (
                <>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-tight">AI Processor</h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Inference engine details</p>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                      <Row label="Provider" value="Groq Cloud" />
                      <Row label="Model" value="Llama 4 Scout 17B" />
                      <Row label="Context" value="16K tokens" />
                      <Row label="Capabilities" value="Vision · JSON" />
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">Used for receipt OCR, batch text import, and spending analysis. Runs entirely via the Groq inference API — no data is stored by the model provider.</p>
                  </div>
                </>
              )}

              {activeModal === 'biometric' && (
                <>
                  <div>
                    <h3 className="text-base font-bold text-white uppercase tracking-tight">Biometric Lock</h3>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Device authentication</p>
                  </div>
                  <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
                      <Fingerprint className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-sm text-gray-400">
                      Secure your app using your device's built-in biometric authentication (Face ID, Touch ID, or PIN).
                    </p>
                    
                    {!isBiometricSupported ? (
                      <p className="text-xs text-rose-500 mt-4 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                        Biometric authentication is not supported or not available on this device.
                      </p>
                    ) : (
                      <button
                        onClick={handleToggleBiometric}
                        className={`w-full mt-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                          biometricCredential 
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {biometricCredential ? (
                          <>Disable Lock</>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Enable Lock
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{label}</span>
      <span className="text-xs font-mono text-white">{value}</span>
    </div>
  );
}
