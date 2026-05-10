import { Category } from './types';

export const DEFAULT_CURRENCY = 'BDT';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Food & Dining', icon: 'Utensils', color: '#f87171', type: 'expense' },
  { id: '2', name: 'Transport', icon: 'Car', color: '#fb923c', type: 'expense' },
  { id: '3', name: 'Entertainment', icon: 'Film', color: '#facc15', type: 'expense' },
  { id: '4', name: 'Shopping', icon: 'ShoppingBag', color: '#4ade80', type: 'expense' },
  { id: '5', name: 'Utilities', icon: 'Zap', color: '#2dd4bf', type: 'expense' },
  { id: '6', name: 'Health', icon: 'Heart', color: '#3b82f6', type: 'expense' },
  { id: '7', name: 'Other', icon: 'MoreHorizontal', color: '#94a3b8', type: 'expense' },
  { id: '8', name: 'Salary', icon: 'DollarSign', color: '#10b981', type: 'income' },
  { id: '9', name: 'Freelance', icon: 'Briefcase', color: '#8b5cf6', type: 'income' },
  { id: '10', name: 'Investment', icon: 'TrendingUp', color: '#ec4899', type: 'income' },
];

export const EXCHANGE_RATES: Record<string, number> = {
  BDT: 1,
  USD: 0.0091,
  EUR: 0.0084,
  GBP: 0.0072,
};
