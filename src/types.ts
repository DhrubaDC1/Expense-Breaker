export type Currency = 'BDT' | 'USD' | 'EUR' | 'GBP';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export interface Transaction {
  id: string;
  amount: number;
  currency: Currency;
  exchangeRateAtEntry: number;
  category: string;
  date: string;
  note: string;
  type: 'expense' | 'income';
  receiptUrl?: string;
  isShared?: boolean;
  spaceId?: string;
}

export interface Budget {
  categoryId: string;
  amount: number;
  month: string; // YYYY-MM
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface SharedSpace {
  id: string;
  name: string;
  members: string[]; // UIDs
}
