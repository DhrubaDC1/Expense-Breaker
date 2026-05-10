import React from 'react';
import { useApp } from '../AppContext';
import { 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  Moon, 
  User, 
  LogOut,
  ChevronRight,
  Cpu,
  Smartphone,
  Cloud
} from 'lucide-react';

export default function Settings() {
  const { currency, setCurrency } = useApp();

  const sections = [
    {
      title: 'Preferences',
      items: [
        { icon: Globe, label: 'Default Currency', value: currency, action: () => setCurrency(currency === 'BDT' ? 'USD' : 'BDT') },
        { icon: Moon, label: 'Appearance', value: 'Glass Dark', action: () => {} },
        { icon: Bell, label: 'Notifications', value: 'Enabled', action: () => {} },
      ]
    },
    {
      title: 'Security',
      items: [
        { icon: Shield, label: 'Biometric Lock', value: 'Disabled', action: () => {} },
        { icon: Database, label: 'Local Encryption', value: 'SQLCipher v4', action: () => {} },
        { icon: Cloud, label: 'Cloud Sync', value: 'Standby', action: () => {} },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: Cpu, label: 'AI Processor', value: 'Gemini 3 Flash', action: () => {} },
        { icon: Smartphone, label: 'Application Version', value: '1.0.0 (Release)', action: () => {} },
      ]
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="flex items-center gap-6 pb-8 border-b border-white/5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-1">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
             <User className="w-10 h-10 text-white/40" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Premium Member</h2>
          <p className="text-sm text-white/40 font-mono uppercase tracking-widest mt-1">Status: Operational</p>
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

      <button className="w-full py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold uppercase tracking-[0.2em] text-xs hover:bg-rose-500/20 transition-all flex items-center justify-center gap-3">
        <LogOut className="w-4 h-4" />
        Sign Out Session
      </button>
      
      <div className="pt-12 text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-medium">ClearLedger Financial Systems</p>
        <p className="text-[8px] text-white/10 uppercase tracking-[0.2em] mt-2">© 2026 • Secure & Private</p>
      </div>
    </div>
  );
}
