import React from 'react';
import { useApp } from '../AppContext';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  TrendingDown, 
  TrendingUp as TrendingUpIcon,
  CreditCard,
  PieChart as PieChartIcon,
  Plus,
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { CATEGORIES } from '../constants';

export default function Dashboard() {
  const { transactions, currency } = useApp();

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Chart data
  const pieData = CATEGORIES
    .map(cat => ({
      name: cat.name,
      value: transactions
        .filter(t => t.category === cat.name && t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0),
      color: cat.color
    }))
    .filter(d => d.value > 0);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-8">
      {/* Balance Card - Span 2 */}
      <div className="md:col-span-2 glass-card p-8 flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <CreditCard className="w-32 h-32 rotate-12" />
        </div>
        <div>
          <span className="section-label">Net Liquidity</span>
          <h2 className="text-5xl font-bold mt-2 tabular-nums text-white tracking-tight">
            {netBalance.toLocaleString()} <span className="text-xl text-gray-600 font-normal">{currency}</span>
          </h2>
        </div>
        <div className="flex gap-8 mt-8">
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
                <Pie
                  data={pieData}
                  innerRadius={55}
                  outerRadius={70}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600 text-[10px] uppercase font-bold tracking-widest">
              Zero Data Points
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity - Span 3 */}
      <div className="md:col-span-3 glass-card p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Live Ledger</h3>
          <button className="text-[10px] text-gray-500 hover:text-white transition-colors font-bold uppercase tracking-widest">Historical View</button>
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
              <p className={cn(
                "font-mono text-sm font-bold",
                t.type === 'income' ? "text-emerald-500" : "text-gray-400"
              )}>
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

      {/* Quick Actions */}
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
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
