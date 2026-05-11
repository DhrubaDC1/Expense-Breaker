import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { SharedSpace, Transaction } from '../types';
import { useApp } from '../AppContext';

interface Props {
  space: SharedSpace | null;
  onClose: () => void;
}

export default function SpaceLedgerModal({ space, onClose }: Props) {
  const { currency } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!space) return;
    const q = query(
      collection(db, `spaces/${space.id}/transactions`),
      orderBy('date', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    return unsub;
  }, [space]);

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  if (!space) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="relative w-full sm:max-w-2xl glass-panel p-6 sm:p-8 max-h-[85vh] flex flex-col sm:rounded-2xl rounded-t-2xl"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">{space.name}</h2>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                Shared Ledger · {space.members.length} member{space.members.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Inflow</p>
              <p className="text-xl font-bold text-emerald-500 mt-1 font-mono">+{totalIncome.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total Outflow</p>
              <p className="text-xl font-bold text-gray-400 mt-1 font-mono">-{totalExpense.toLocaleString()}</p>
            </div>
          </div>

          {/* Transaction list */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {transactions.length === 0 ? (
              <div className="py-16 text-center text-gray-600 text-[10px] uppercase font-bold tracking-[0.2em]">
                No transactions in this space yet
              </div>
            ) : (
              transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-gray-500'}`}>
                      {t.type === 'income' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">{t.note || t.category}</p>
                      <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">
                        {t.category} · {new Date(t.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`font-mono text-sm font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} <span className="text-[10px] opacity-40">{currency}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
