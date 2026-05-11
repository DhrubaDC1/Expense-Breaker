import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { CreditCard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from 'recharts';
import { CATEGORIES } from '../constants';
import { format, subDays, parseISO } from 'date-fns';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const { transactions, currency } = useApp();
  const [showHistory, setShowHistory] = useState(false);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const pieData = CATEGORIES
    .map(cat => ({
      name: cat.name,
      value: transactions.filter(t => t.category === cat.name && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
      color: cat.color,
    }))
    .filter(d => d.value > 0);

  const recentTransactions = transactions.slice(0, 5);

  // 30-day daily data for historical view
  const historicalData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayExpenses = transactions
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      const dayIncome = transactions
        .filter(t => t.type === 'income' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      return { date: format(date, 'MMM d'), expenses: dayExpenses, income: dayIncome };
    });
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    return CATEGORIES
      .filter(c => c.type === 'expense')
      .map(cat => ({
        name: cat.name.split(' ')[0], // short name for bar chart
        amount: transactions.filter(t => t.category === cat.name && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        color: cat.color,
      }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-8">
        {/* Balance Card */}
        <div className="md:col-span-2 glass-card p-6 sm:p-8 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <CreditCard className="w-32 h-32 rotate-12" />
          </div>
          <div>
            <span className="section-label">Net Liquidity</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-2 tabular-nums text-white tracking-tight">
              {netBalance.toLocaleString()} <span className="text-lg sm:text-xl text-gray-600 font-normal">{currency}</span>
            </h2>
          </div>
          <div className="flex gap-4 sm:gap-8 mt-6 sm:mt-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Inflow</p>
                <p className="text-white font-mono text-sm">{totalIncome.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Outflow</p>
                <p className="text-white font-mono text-sm">{totalExpense.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Metric */}
        <div className="glass-card p-6 flex flex-col justify-between bg-[#111111]">
          <div>
            <span className="section-label">Efficiency</span>
            <div className="flex items-end gap-2 mt-2">
              <h3 className="text-3xl font-bold text-white font-mono">
                {totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0}%
              </h3>
              <span className="text-[10px] text-emerald-500 font-bold mb-1 uppercase tracking-wider">Target +4%</span>
            </div>
          </div>
          <div className="h-16 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{v:10}, {v:15}, {v:12}, {v:18}, {v:16}, {v:22}]}>
                <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Card */}
        <div className="glass-card p-6 flex flex-col">
          <span className="section-label">Allocation</span>
          <div className="flex-1 min-h-[140px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={55} outerRadius={70} paddingAngle={8} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 text-[10px] uppercase font-bold tracking-widest">
                Zero Data Points
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="md:col-span-3 glass-card p-6 sm:p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Live Ledger</h3>
            <button
              onClick={() => setShowHistory(true)}
              className="text-[10px] text-gray-500 hover:text-white transition-colors font-bold uppercase tracking-widest"
            >
              Historical View
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.length > 0 ? recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 hover:bg-white/[0.02] transition-all border border-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORIES.find(c => c.name === t.category)?.color }}></div>
                  <div>
                    <p className="font-medium text-sm text-gray-200">{t.note || t.category}</p>
                    <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">{t.category} <span className="opacity-30 mx-1">/</span> {new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={cn("font-mono text-sm font-bold", t.type === 'income' ? "text-emerald-500" : "text-gray-400")}>
                  {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()}
                </p>
              </div>
            )) : (
              <div className="py-12 text-center text-gray-600 text-[10px] uppercase font-bold tracking-[0.2em]">
                Empty Ledger State
              </div>
            )}
          </div>
        </div>

        {/* System Insights */}
        <div className="glass-card p-6">
          <span className="section-label">System Insights</span>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[9px] text-emerald-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Optimization
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">Budget utilization is at <span className="text-white">82%</span>. Resource allocation for 'Food' exceeds suggested baseline.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[9px] text-emerald-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Projections
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">System predicts a <span className="text-white">+12.4%</span> increase in net liquidity by end-of-cycle.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical View Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="relative w-full sm:max-w-3xl glass-panel p-6 sm:p-8 max-h-[85vh] overflow-y-auto sm:rounded-2xl rounded-t-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Historical View</h2>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Last 30 days · {currency}</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* 30-day area chart */}
              <div className="mb-8">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-4">Daily Flow</p>
                {transactions.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-gray-600 text-[10px] uppercase font-bold tracking-widest">No data yet</div>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historicalData}>
                        <defs>
                          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 9 }} tickLine={false} axisLine={false} interval={6} />
                        <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} tickLine={false} axisLine={false} width={40} />
                        <Tooltip
                          contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                        />
                        <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="url(#incGrad)" strokeWidth={1.5} />
                        <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#6b7280" fill="url(#expGrad)" strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Category breakdown bar chart */}
              {categoryTotals.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-4">Expense by Category (All Time)</p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryTotals} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 9 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} tickLine={false} axisLine={false} width={40} />
                        <Tooltip
                          contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                        />
                        <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                          {categoryTotals.map((entry, index) => (
                            <Cell key={index} fill={entry.color} opacity={0.7} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
