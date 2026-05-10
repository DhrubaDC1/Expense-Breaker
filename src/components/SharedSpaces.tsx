import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, UserPlus, Share2, ArrowRight, Shield, Globe, Lock } from 'lucide-react';
import { useApp } from '../AppContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { SharedSpace } from '../types';

export default function SharedSpaces() {
  const { user } = useApp();
  const [spaces, setSpaces] = useState<SharedSpace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinId, setJoinId] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'spaces'), where('members', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (s) => {
      setSpaces(s.docs.map(d => ({ id: d.id, ...d.data() } as SharedSpace)));
    });
    return unsub;
  }, [user]);

  const createSpace = async () => {
    if (!newName.trim() || !user) return;
    await addDoc(collection(db, 'spaces'), {
      name: newName,
      members: [user.uid],
      createdAt: new Date().toISOString()
    });
    setNewName('');
    setIsCreating(false);
  };

  const joinSpace = async () => {
    if (!joinId.trim() || !user) return;
    try {
      const spaceRef = doc(db, 'spaces', joinId);
      await updateDoc(spaceRef, {
        members: arrayUnion(user.uid)
      });
      setJoinId('');
    } catch (e) {
      alert("Invalid Space ID or Access Denied");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Collaborative Spaces</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Multi-user real-time reconciliation</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-lg text-[10px] font-bold text-black uppercase tracking-widest hover:scale-105 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Initialize Space
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {spaces.map((space) => (
            <motion.div
              key={space.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 group cursor-pointer hover:border-emerald-500/30 transition-all border border-white/5"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-emerald-500/10 transition-colors">
                  <Users className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex -space-x-2">
                  {space.members.map((m, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-black flex items-center justify-center text-[10px] font-bold text-white uppercase">
                      {m.slice(0, 1)}
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{space.name}</h3>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-6">ID: {space.id}</p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <button className="flex-1 py-2 text-[9px] uppercase font-bold tracking-widest text-emerald-500 bg-emerald-500/5 rounded-md hover:bg-emerald-500/10 transition-all">
                  Open Ledger
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(space.id!);
                    // Add toast logic here
                  }}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                  title="Copy Invite ID"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="glass-card p-6 flex flex-col items-center justify-center border-dashed border-2 border-white/5 bg-transparent">
          <div className="text-center space-y-4 w-full">
            <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-600">Join Existing Protocol</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={joinId}
                onChange={e => setJoinId(e.target.value)}
                placeholder="Protocol ID..."
                className="flex-1 glass-input py-2 text-xs"
              />
              <button 
                onClick={joinSpace}
                className="p-2 bg-white/5 rounded-lg text-emerald-500 hover:bg-white/10 transition-all"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-8 w-full max-w-sm space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">New Collaborative Space</h3>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Define shared protocol name</p>
              </div>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Household Ledger"
                autoFocus
                className="w-full glass-input"
              />
              <div className="flex gap-4">
                <button onClick={() => setIsCreating(false)} className="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-white">Cancel</button>
                <button onClick={createSpace} className="flex-1 py-3 bg-emerald-500 text-black rounded-lg text-[10px] uppercase tracking-widest font-bold">Initialize</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
