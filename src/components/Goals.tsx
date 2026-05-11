import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../AppContext';
import { useToast } from '../ToastContext';
import { CATEGORIES } from '../constants';
import { Target, Plus, Sparkles, Trash2, Pencil, X, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal } from '../types';
import AddGoalModal from './AddGoalModal';

const currentMonthKey = () => new Date().toISOString().slice(0, 7);

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

// ─── Delete confirmation modal ───────────────────────────────────────────────

interface DeleteModalProps {
  goal: Goal | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteGoalModal({ goal, onConfirm, onCancel, isDeleting }: DeleteModalProps) {
  if (!goal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm glass-panel p-8 space-y-6"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-base font-bold text-white uppercase tracking-tight">Delete Goal</h3>
          <p className="text-sm text-white/60">
            Permanently remove <span className="text-white font-semibold">"{goal.name}"</span>? This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white bg-white/[0.02] border border-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 bg-rose-500 text-black rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Apply Plan confirmation modal ────────────────────────────────────────────

interface ApplyPlanConfirmProps {
  saving: number;
  category: string;
  categorySpend: number;
  goalName: string;
  newAmount: number;
  targetAmount: number;
  currency: string;
  onConfirm: () => void;
  onCancel: () => void;
  isApplying: boolean;
}

function ApplyPlanConfirm({
  saving, category, categorySpend, goalName, newAmount, targetAmount, currency,
  onConfirm, onCancel, isApplying,
}: ApplyPlanConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm glass-panel p-8 space-y-6"
      >
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-tight">Apply Savings Plan</h3>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Review and confirm</p>
        </div>

        {/* The math */}
        <div className="space-y-2.5 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">'{category}' spend this month</span>
            <span className="font-mono text-white">{categorySpend.toLocaleString()} {currency}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Suggested 20% reduction</span>
            <span className="font-mono text-emerald-400 font-bold">+{saving.toLocaleString()} {currency}</span>
          </div>
          <div className="border-t border-white/5 my-2" />
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">"{goalName}" progress</span>
            <span className="font-mono text-white">
              {newAmount.toLocaleString()} <span className="text-white/30">/ {targetAmount.toLocaleString()}</span>
            </span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed text-center">
          Applies once per month. The catalyst will hide until next month.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isApplying}
            className="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white bg-white/[0.02] border border-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isApplying}
            className="flex-[2] py-3 bg-emerald-500 text-black rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
          >
            {isApplying ? 'Applying…' : 'Confirm & Apply'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Inline progress logger ───────────────────────────────────────────────────

interface InlineProgressProps {
  goal: Goal;
  currency: string;
  onClose: () => void;
}

function InlineProgress({ goal, currency, onClose }: InlineProgressProps) {
  const { updateGoal } = useApp();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0 || busy) return;
    setBusy(true);
    try {
      const newAmount = Math.min(goal.currentAmount + value, goal.targetAmount);
      await updateGoal(goal.id, { currentAmount: newAmount });
      toast(`${value.toLocaleString()} ${currency} logged toward "${goal.name}"`, 'success');
      setAmount('');
      onClose();
    } catch {
      toast('Failed to log progress', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="pt-3 flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder={`+ amount in ${currency}`}
          autoFocus
          min="0"
          step="any"
          className="flex-1 glass-input py-2 text-sm"
        />
        <button
          onClick={handleSave}
          disabled={!amount || busy}
          className="px-4 bg-emerald-500 text-black rounded-xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-40 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {busy ? '…' : 'Save'}
        </button>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-white bg-white/5 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Goals() {
  const { user, goals, transactions, currency, deleteGoal, updateGoal } = useApp();
  const { toast } = useToast();

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logProgressGoalId, setLogProgressGoalId] = useState<string | null>(null);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedMonth, setAppliedMonth] = useState<string | null>(null);

  // Load "applied this month" marker from localStorage
  const storageKey = user ? `aiCatalyst_applied_${user.uid}` : null;
  useEffect(() => {
    if (!storageKey) return;
    setAppliedMonth(localStorage.getItem(storageKey));
  }, [storageKey]);

  // Compute real top-expense category for current month
  const aiSuggestion = useMemo(() => {
    const month = currentMonthKey();
    const monthExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(month));
    if (monthExpenses.length === 0) return null;

    const byCategory = CATEGORIES
      .filter(c => c.type === 'expense')
      .map(cat => ({
        name: cat.name,
        amount: monthExpenses.filter(t => t.category === cat.name).reduce((sum, t) => sum + t.amount, 0),
      }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    if (byCategory.length === 0) return null;
    const top = byCategory[0];
    return { category: top.name, spend: top.amount, saving: Math.round(top.amount * 0.2) };
  }, [transactions]);

  const targetGoal = useMemo(() =>
    [...goals].sort((a, b) => (b.targetAmount - b.currentAmount) - (a.targetAmount - a.currentAmount))[0] ?? null,
    [goals]
  );

  const isAppliedThisMonth = appliedMonth === currentMonthKey();
  const showCatalyst = aiSuggestion && targetGoal && !isAppliedThisMonth;

  const handleConfirmApply = async () => {
    if (!aiSuggestion || !targetGoal || isApplying || !storageKey) return;
    setIsApplying(true);
    try {
      const newAmount = Math.min(targetGoal.currentAmount + aiSuggestion.saving, targetGoal.targetAmount);
      await updateGoal(targetGoal.id, { currentAmount: newAmount });
      const month = currentMonthKey();
      localStorage.setItem(storageKey, month);
      setAppliedMonth(month);
      toast(`${aiSuggestion.saving.toLocaleString()} ${currency} credited to "${targetGoal.name}"`, 'success');
      setShowApplyConfirm(false);
    } catch (e) {
      console.error('Apply plan failed:', e);
      toast('Failed to apply plan', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGoal || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteGoal(deletingGoal.id);
      toast('Goal removed', 'info');
      setDeletingGoal(null);
    } catch (e) {
      console.error('Delete failed:', e);
      toast('Delete failed — verify Firestore rules are deployed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const projectedAfterApply = useMemo(() => {
    if (!aiSuggestion || !targetGoal) return 0;
    return Math.min(targetGoal.currentAmount + aiSuggestion.saving, targetGoal.targetAmount);
  }, [aiSuggestion, targetGoal]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Financial Goals</h2>
          <p className="text-sm text-white/40 font-mono uppercase tracking-widest mt-1">Transform your future</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="glass-button border-emerald-500/20 text-emerald-400"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">New Goal</span>
        </button>
      </div>

      {/* Goal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.length > 0 ? goals.map((goal) => {
          const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
          const days = daysUntil(goal.deadline);
          const isLogging = logProgressGoalId === goal.id;
          const isComplete = goal.currentAmount >= goal.targetAmount;

          let status: { label: string; tone: string };
          if (isComplete) status = { label: 'Complete', tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
          else if (days < 0) status = { label: 'Overdue', tone: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
          else if (days <= 7) status = { label: `${days}d left`, tone: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
          else status = { label: `${days}d left`, tone: 'text-gray-400 bg-white/5 border-white/5' };

          return (
            <div key={goal.id} className="glass-card p-6 flex flex-col gap-5">
              {/* Top row: icon + name + actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-emerald-500 shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate">{goal.name}</h3>
                    <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mt-0.5">
                      Due {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    title="Edit goal"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingGoal(goal)}
                    className="p-2 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Saved</p>
                    <p className="text-2xl font-bold font-mono mt-0.5">
                      {goal.currentAmount.toLocaleString()}
                      <span className="text-sm text-white/30 font-normal ml-1">{currency}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Target</p>
                    <p className="text-lg font-bold font-mono text-white/50 mt-0.5">
                      {goal.targetAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{pct}% complete</p>
                  <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md border ${status.tone}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Action — inline log progress */}
              {!isComplete && (
                <>
                  {!isLogging && (
                    <button
                      onClick={() => setLogProgressGoalId(goal.id)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Log Progress
                    </button>
                  )}
                  <AnimatePresence>
                    {isLogging && (
                      <InlineProgress
                        goal={goal}
                        currency={currency}
                        onClose={() => setLogProgressGoalId(null)}
                      />
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          );
        }) : (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center col-span-2 border-dashed border-white/10 bg-transparent">
            <div className="p-5 rounded-full bg-white/5 mb-5">
              <Target className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-lg font-bold">No active goals</h3>
            <p className="text-sm text-white/40 mt-2 max-w-xs leading-relaxed">
              Set a savings target and track your progress. ClearLedger will help you get there.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-6 px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              Create your first goal
            </button>
          </div>
        )}
      </div>

      {/* AI Savings Catalyst — hidden once applied for the month */}
      {showCatalyst && aiSuggestion && targetGoal && (
        <div className="glass-panel p-6 md:p-8 bg-emerald-500/5 border-emerald-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="p-4 rounded-3xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold">AI Savings Catalyst</h4>
              <p className="text-sm text-white/60 mt-1">
                Reduce <span className="text-white font-semibold">'{aiSuggestion.category}'</span> by 20% this month and credit{' '}
                <span className="text-emerald-400 font-bold">{aiSuggestion.saving.toLocaleString()} {currency}</span>{' '}
                toward <span className="text-white font-semibold">"{targetGoal.name}"</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowApplyConfirm(true)}
            className="w-full md:w-auto shrink-0 px-6 py-3 bg-emerald-500 text-black font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            Apply Plan
          </button>
        </div>
      )}

      {/* Modals */}
      <AddGoalModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <AddGoalModal isOpen={!!editingGoal} goal={editingGoal} onClose={() => setEditingGoal(null)} />

      <AnimatePresence>
        {deletingGoal && (
          <DeleteGoalModal
            goal={deletingGoal}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeletingGoal(null)}
            isDeleting={isDeleting}
          />
        )}
        {showApplyConfirm && aiSuggestion && targetGoal && (
          <ApplyPlanConfirm
            saving={aiSuggestion.saving}
            category={aiSuggestion.category}
            categorySpend={aiSuggestion.spend}
            goalName={targetGoal.name}
            newAmount={projectedAfterApply}
            targetAmount={targetGoal.targetAmount}
            currency={currency}
            onConfirm={handleConfirmApply}
            onCancel={() => setShowApplyConfirm(false)}
            isApplying={isApplying}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
