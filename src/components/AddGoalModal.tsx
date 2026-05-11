import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useApp } from '../AppContext';
import { Goal } from '../types';
import { useWebHaptics } from 'web-haptics/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
}

export default function AddGoalModal({ isOpen, onClose, goal }: Props) {
  const { addGoal, updateGoal, currency } = useApp();
  const isEdit = !!goal;
  const { trigger } = useWebHaptics();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        setName(goal.name);
        setTargetAmount(String(goal.targetAmount));
        setDeadline(goal.deadline);
      } else {
        setName('');
        setTargetAmount('');
        setDeadline(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      }
    }
  }, [isOpen, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount || isSubmitting) {
      if (!name.trim() || !targetAmount) trigger("error");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEdit && goal) {
        await updateGoal(goal.id, {
          name: name.trim(),
          targetAmount: parseFloat(targetAmount),
          deadline,
        });
      } else {
        await addGoal({
          name: name.trim(),
          targetAmount: parseFloat(targetAmount),
          currentAmount: 0,
          deadline,
        });
      }
      trigger("success");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass-panel p-8 space-y-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                {isEdit ? 'Edit Goal' : 'New Financial Goal'}
              </h2>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                {isEdit ? 'Adjust your objective' : 'Define your objective'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="section-label">Goal Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Emergency Fund"
                autoFocus
                className="w-full glass-input"
              />
            </div>

            <div className="space-y-2">
              <label className="section-label">Target Amount ({currency})</label>
              <input
                type="number"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="w-full glass-input"
              />
            </div>

            <div className="space-y-2">
              <label className="section-label">Target Date</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full glass-input"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] py-3 bg-emerald-500 text-black rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
