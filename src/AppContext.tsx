import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, Budget, Goal, SharedSpace } from './types';
import { DEFAULT_CURRENCY } from './constants';
import { 
  db, 
  auth, 
  loginWithGoogle, 
  handleRedirectResult,
  logout 
} from './lib/firebase';
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  runTransaction
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { decryptData, encryptData } from './lib/encryption';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface AppContextType {
  user: User | null;
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  budgets: Budget[];
  goals: Goal[];
  addGoal: (g: Omit<Goal, 'id'>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoal: (id: string, data: Partial<Omit<Goal, 'id'>>) => Promise<void>;
  spaces: SharedSpace[];
  deleteSpace: (id: string) => Promise<void>;
  currency: string;
  setCurrency: (c: string) => void;
  isLoading: boolean;
  isAuthLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [spaces, setSpaces] = useState<SharedSpace[]>([]);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Auth State — also handles redirect sign-in result (fallback from popup-blocked)
  useEffect(() => {
    // Process any pending redirect sign-in result first (no-op if no redirect happened)
    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
      setIsSigningIn(false);
      if (!u) {
        setIsLoading(false);
        setTransactions([]);
        setBudgets([]);
        setGoals([]);
        setSpaces([]);
      }
    });
    return unsubscribe;
  }, []);

  // Sync Transactions
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/transactions`;
    const q = query(collection(db, path), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const processedDocs = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let note = data.note;
        
        // If it looks like base64 encrypted data (and not a simple string), try decrypting
        if (data.isEncrypted && data.note && user.uid) {
          note = await decryptData(data.note, user.uid);
        }
        
        return { 
          id: doc.id, 
          ...data, 
          note 
        } as Transaction;
      }));
      
      setTransactions(processedDocs);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [user]);

  // Sync Goals
  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}/goals`;
    const unsub = onSnapshot(collection(db, path), (snapshot) => {
      setGoals(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return unsub;
  }, [user]);

  // Sync Spaces
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'spaces'), where('members', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setSpaces(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SharedSpace)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'spaces');
    });
    return unsub;
  }, [user]);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    const id = crypto.randomUUID();
    const path = `users/${user.uid}/transactions/${id}`;
    
    try {
      // Encrypt sensitive note
      let noteToStore = t.note;
      let isEncrypted = false;
      
      if (t.note && user.uid) {
        noteToStore = await encryptData(t.note, user.uid);
        isEncrypted = true;
      }

      await setDoc(doc(db, path), {
        ...t,
        note: noteToStore,
        isEncrypted,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, [user]);

  const addGoal = useCallback(async (g: Omit<Goal, 'id'>) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const path = `users/${user.uid}/goals/${id}`;
    try {
      await setDoc(doc(db, path), { ...g, userId: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, [user]);

  const deleteSpace = useCallback(async (id: string) => {
    if (!user) return;
    const path = `spaces/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }, [user]);

  const updateGoal = useCallback(async (id: string, data: Partial<Omit<Goal, 'id'>>) => {
    if (!user) return;
    const path = `users/${user.uid}/goals/${id}`;
    try {
      await setDoc(doc(db, path), data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }, [user]);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      setIsSigningIn(false);
      if (
        error.code === 'auth/cancelled-popup-request' ||
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/popup-blocked'          // handled by redirect fallback in loginWithGoogle
      ) {
        console.warn("Sign-in interaction was cancelled, interrupted, or popup was blocked (redirect fallback used).");
      } else {
        console.error("Sign-in error:", error);
        throw error;
      }
    }
  };

  const signOutUser = async () => {
    await logout();
  };

  return (
    <AppContext.Provider value={{
      user,
      transactions,
      addTransaction,
      deleteTransaction,
      budgets,
      goals,
      addGoal,
      deleteGoal,
      updateGoal,
      spaces,
      deleteSpace,
      currency,
      setCurrency,
      isLoading,
      isAuthLoading: isAuthLoading || isSigningIn,
      signIn,
      signOut: signOutUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
