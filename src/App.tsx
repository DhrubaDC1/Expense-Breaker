/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { ToastProvider } from './ToastContext';
import { CATEGORIES, EXCHANGE_RATES } from './constants';
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  Settings, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  Scan,
  X,
  CreditCard,
  PieChart as PieChartIcon,
  TrendingUp,
  History,
  Wallet,
  Users,
  LogOut,
  User as UserIcon
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import SettingsPage from './components/Settings';
import AddTransactionModal from './components/AddTransactionModal';
import BatchImportModal from './components/BatchImportModal';
import Login from './components/Login';
import SharedSpaces from './components/SharedSpaces';

import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useWebHaptics } from 'web-haptics/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'goals' | 'spaces' | 'settings'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const { user, isAuthLoading, signOut } = useApp();
  const { trigger } = useWebHaptics();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'transactions', icon: History, label: 'Activity' },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'spaces', icon: Users, label: 'Collaborate' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="relative min-h-screen pb-24">
      {/* Header */}
      <header className="p-4 md:p-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black/20 rounded-sm rotate-45"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">
              ClearLedger
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Operational Platform</p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="hidden md:flex flex-col items-end mr-2">
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{user?.email}</p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active Session</p>
          </div>
          <button 
            onClick={() => {
              trigger("warning");
              signOut();
            }}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-rose-500"
            title="Terminate Session"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard />
            </motion.div>
          )}
          {activeTab === 'transactions' && (
            <motion.div key="transactions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Transactions />
            </motion.div>
          )}
          {activeTab === 'goals' && (
            <motion.div key="goals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Goals />
            </motion.div>
          )}
          {activeTab === 'spaces' && (
            <motion.div key="spaces" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SharedSpaces />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl z-40 w-[95%] sm:w-auto max-w-fit justify-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (activeTab !== tab.id) trigger("selection");
                setActiveTab(tab.id as any);
              }}
              className={cn(
                "p-2.5 sm:p-3.5 rounded-xl transition-all duration-200 relative group",
                activeTab === tab.id ? "bg-white/5 text-emerald-500 shadow-inner" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className="w-5 h-5" />
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-emerald-500 rounded-full"
                />
              )}
            </button>
          );
        })}
        
        <div className="w-px h-6 bg-white/5 mx-1.5" />
        
        <button 
          onClick={() => {
            trigger("light");
            setIsBatchModalOpen(true);
          }}
          className="p-2.5 sm:p-3.5 bg-white/5 text-emerald-500 rounded-xl hover:bg-white/10 transition-all border border-white/5 group"
          title="Batch Import"
        >
          <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        <button 
          onClick={() => {
            trigger("medium");
            setIsAddModalOpen(true);
          }}
          className="p-2.5 sm:p-3.5 bg-emerald-500 text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <Plus className="w-5 h-5" />
        </button>
      </nav>

      {/* Modals */}
      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <BatchImportModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} />
    </div>
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

