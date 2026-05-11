import React from 'react';
import { useApp } from '../AppContext';
import { CATEGORIES } from '../constants';
import { Trash2, ShoppingBag, Receipt, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function Transactions() {
  const { transactions, deleteTransaction, currency } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Activity Log</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Real-time ledger processing</p>
        </div>
      </div>

      <div className="glass-card">
        {/* Mobile View */}
        <div className="block sm:hidden divide-y divide-white/5">
          {transactions.length > 0 ? transactions.map((t) => (
            <div key={t.id} className="p-4 flex flex-col gap-3 group hover:bg-white/[0.01] transition-colors">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-700 mt-1.5 flex-shrink-0"></div>
                  <span className="font-medium text-xs text-gray-300 break-words line-clamp-2">{t.note || 'Process Entry'}</span>
                </div>
                <div className="flex items-center gap-1 font-bold whitespace-nowrap flex-shrink-0 ml-2">
                   <span className={t.type === 'income' ? 'text-emerald-500' : 'text-gray-400'}>
                     {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} <span className="text-[10px] opacity-40">{currency}</span>
                   </span>
                </div>
              </div>
              <div className="flex justify-between items-center pl-4.5">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] uppercase tracking-wider font-bold py-1 px-2 rounded bg-white/5 text-gray-500 border border-white/5">
                    {t.category}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(t.date).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  onClick={() => deleteTransaction(t.id)}
                  className="p-1.5 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )) : (
            <div className="px-6 py-20 text-center text-gray-700 text-[10px] uppercase font-bold tracking-[0.2em]">Zero entries recorded</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Transaction Unit</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Category</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Timestamp</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Value</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">States</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {transactions.length > 0 ? transactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
                      <span className="font-medium text-xs text-gray-300">{t.note || 'Process Entry'}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className="text-[9px] uppercase tracking-wider font-bold py-1 px-2 rounded bg-white/5 text-gray-500 border border-white/5">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-[10px] text-gray-500">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-1 font-bold">
                       <span className={t.type === 'income' ? 'text-emerald-500' : 'text-gray-400'}>
                         {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()} <span className="text-[10px] opacity-40">{currency}</span>
                       </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <button 
                      onClick={() => deleteTransaction(t.id)}
                      className="p-1.5 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-700 text-[10px] uppercase font-bold tracking-[0.2em]">Zero entries recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
