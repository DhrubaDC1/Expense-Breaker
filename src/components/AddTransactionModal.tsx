import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Scan, Sparkles, Check, Loader2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { CATEGORIES, DEFAULT_CURRENCY } from '../constants';
import { extractTransactionFromImage } from '../services/aiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ isOpen, onClose }: Props) {
  const { addTransaction, currency } = useApp();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    addTransaction({
      amount: parseFloat(amount),
      currency: currency as any,
      exchangeRateAtEntry: 1,
      category,
      date,
      note,
      type,
    });
    
    // Reset and close
    setAmount('');
    setNote('');
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await extractTransactionFromImage(base64);
      
      if (result) {
        setAmount(result.amount.toString());
        setCategory(result.category);
        if (result.merchant || result.note) {
          setNote(`${result.merchant || ''} ${result.note || ''}`.trim());
        }
        if (result.date) setDate(result.date);
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
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
          className="relative w-full max-w-lg glass-panel p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
               <h2 className="text-lg font-bold text-white uppercase tracking-tight">Manual Process Entry</h2>
               <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">New ledger record</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Toggle Type */}
          <div className="flex p-1 bg-black/40 border border-white/5 rounded-xl mb-10">
            <button
              onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all ${
                type === 'expense' ? 'bg-white/5 text-emerald-500 shadow-inner' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              Debit
            </button>
            <button
              onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all ${
                type === 'income' ? 'bg-white/5 text-emerald-500 shadow-inner' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              Credit
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full bg-transparent text-5xl sm:text-6xl font-bold border-none outline-none text-center placeholder:text-white/[0.02] text-white font-mono"
              />
              <span className="absolute right-0 bottom-2 text-xs text-gray-600 font-bold uppercase tracking-widest">{currency}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3">
                <label className="section-label mb-0">System Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full glass-input appearance-none"
                >
                  {CATEGORIES.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.name} className="bg-[#111111] text-white">{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="section-label mb-0">Event Horizon</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full glass-input"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="section-label mb-0">Entry Description</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Protocol details..."
                rows={2}
                className="w-full glass-input resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex-1 glass-button font-bold uppercase tracking-[0.2em] text-[10px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 py-4 sm:py-auto flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>OCR Scan</span>
                  </>
                )}
              </button>
              <button
                type="submit"
                className="flex-[2] py-4 bg-emerald-500 text-black rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-95 transition-all"
              >
                Execute Transaction
              </button>
            </div>
          </form>

          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="mt-6 flex items-center justify-center gap-2 text-white/30">
            <Sparkles className="w-3 h-3" />
            <p className="text-[10px] uppercase tracking-widest">AI suggests categories based on your history</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
