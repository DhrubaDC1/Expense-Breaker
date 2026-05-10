import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Scan, Sparkles, Check, Loader2, List, Trash2, Edit2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { CATEGORIES } from '../constants';
import { extractTransactionsFromMultipleImages, parseSmartImport, ExtractedTransaction } from '../services/aiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BatchImportModal({ isOpen, onClose }: Props) {
  const { addTransaction, currency } = useApp();
  const [importType, setImportType] = useState<'images' | 'text'>('images');
  const [pastedText, setPastedText] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setIsProcessing(true);
    const base64s = await Promise.all(
      files.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      }))
    );

    const results = await extractTransactionsFromMultipleImages(base64s);
    setExtractedData(prev => [...prev, ...results]);
    setIsProcessing(false);
  };

  const handleTextImport = async () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    const results = await parseSmartImport(pastedText);
    setExtractedData(prev => [...prev, ...results]);
    setPastedText('');
    setIsProcessing(false);
  };

  const handleSaveAll = () => {
    extractedData.forEach(item => {
      addTransaction({
        amount: item.amount,
        currency: currency as any,
        exchangeRateAtEntry: 1,
        category: item.category,
        date: item.date,
        note: `${item.merchant || ''} ${item.note || ''}`.trim() || 'Imported Entry',
        type: 'expense', // Default to expense for imports
      });
    });
    setExtractedData([]);
    onClose();
  };

  const removeItem = (index: number) => {
    setExtractedData(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-2xl glass-panel p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Batch Protocol Import</h2>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Multiple ledger entries via AI</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {!extractedData.length ? (
            <div className="space-y-8">
              <div className="flex p-1 bg-black/40 border border-white/5 rounded-xl">
                <button
                  onClick={() => setImportType('images')}
                  className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all ${
                    importType === 'images' ? 'bg-white/5 text-emerald-500 shadow-inner' : 'text-gray-600'
                  }`}
                >
                  Receipt Scan
                </button>
                <button
                  onClick={() => setImportType('text')}
                  className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all ${
                    importType === 'text' ? 'bg-white/5 text-emerald-500 shadow-inner' : 'text-gray-600'
                  }`}
                >
                  Raw Text
                </button>
              </div>

              {importType === 'images' ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/5 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center gap-4 hover:bg-white/[0.02] transition-all cursor-pointer group"
                >
                  <div className="p-5 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">Select Receipt Images</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">PNG, JPG, HEIF • Batch processing enabled</p>
                  </div>
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImagesUpload} />
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder="Paste CSV, bank statements, or freeform text here..."
                    className="w-full h-48 glass-input resize-none p-6 font-mono text-xs leading-relaxed"
                  />
                  <button 
                    onClick={handleTextImport}
                    disabled={isProcessing || !pastedText.trim()}
                    className="w-full py-4 bg-emerald-500 text-black rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Analyze & Extract'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-4">
                <span className="section-label mb-0">{extractedData.length} Entries Detected</span>
                <button 
                  onClick={() => setExtractedData([])}
                  className="text-[10px] text-gray-600 hover:text-white uppercase font-bold tracking-widest transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-8">
                {extractedData.map((item, i) => (
                  <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                       <div>
                         <p className="text-xs font-bold text-white">{item.merchant || item.note || 'Process Entry'}</p>
                         <p className="text-[9px] text-gray-600 uppercase font-bold tracking-wider">{item.category} <span className="opacity-30 mx-1">/</span> {item.date}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-mono font-bold text-white tracking-tight">{item.amount.toLocaleString()} <span className="text-[10px] text-gray-600">{item.currency || currency}</span></p>
                      <button onClick={() => removeItem(i)} className="p-1 px-2 hover:bg-rose-500/10 rounded-md text-rose-500/40 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleSaveAll}
                className="w-full py-4 bg-emerald-500 text-black rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                Execute All Entries
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20">
               <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
               <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-emerald-500 animate-pulse">Processing Batch Data...</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
