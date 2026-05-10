import React from 'react';
import { useApp } from '../AppContext';
import { Target, TrendingUp, Calendar, Plus, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Goals() {
  const { goals, currency } = useApp();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Financial Goals</h2>
          <p className="text-sm text-white/40 font-mono uppercase tracking-widest mt-1">Transform your future</p>
        </div>
        <button className="glass-button border-emerald-500/20 text-emerald-400">
          <Plus className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">New Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.length > 0 ? goals.map((goal) => (
          <div key={goal.id} className="glass-card p-6 flex flex-col gap-6 group hover:border-white/20 transition-all">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white/60">
                <Target className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Target Date</p>
                <p className="text-sm font-medium">{new Date(goal.deadline).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold">{goal.name}</h3>
              <div className="flex justify-between items-end mt-2">
                <p className="text-3xl font-bold">
                  {goal.currentAmount.toLocaleString()} <span className="text-sm text-white/40 font-normal">{currency}</span>
                </p>
                <p className="text-sm text-white/40">of {goal.targetAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 relative"
                >
                   <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_100%] animate-shimmer" />
                </motion.div>
              </div>
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-white/40">
                <span>Progress</span>
                <span>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
              </div>
            </div>
          </div>
        )) : (
          /* Mock example if none */
          <div className="glass-card p-6 opacity-60 border-dashed border-white/10 flex flex-col items-center justify-center py-12 text-center col-span-2">
             <div className="p-6 rounded-full bg-white/5 mb-4">
                <Target className="w-12 h-12 text-white/20" />
             </div>
             <h3 className="text-lg font-bold">No active goals</h3>
             <p className="text-sm text-white/40 mt-2 max-w-xs">Start saving for your dreams. ClearLedger helps you stay on track with automated reminders and progress tracking.</p>
             <button className="glass-button mt-6 text-white text-xs uppercase tracking-widest px-8">Create your first goal</button>
          </div>
        )}
      </div>

      <div className="glass-panel p-8 bg-emerald-500/5 border-emerald-500/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-3xl bg-emerald-500/20 text-emerald-400">
             <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold">AI Savings Catalyst</h4>
            <p className="text-sm text-white/60">Based on your spending, we found you could save an extra 1,500 BDT this month by reducing 'Entertainment' expenses.</p>
          </div>
        </div>
        <button className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20">Apply Plan</button>
      </div>
    </div>
  );
}
