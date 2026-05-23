import { createWorker } from 'tesseract.js';
import type { ExtractedTransaction } from './aiService';

export async function recognizeReceiptText(base64: string): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker(['eng', 'ben']);
  try {
    const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob();
    const url = URL.createObjectURL(blob);
    try {
      const result = await worker.recognize(url);
      return {
        text: result.data.text,
        confidence: result.data.confidence / 100,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  } finally {
    await worker.terminate();
  }
}

export function parseReceiptText(text: string, defaultCurrency: string): Partial<ExtractedTransaction> {
  const lower = text.toLowerCase();

  const amountKeywords = /total|grand total|amount|মোট|পরিমাণ/i;
  let amount: number | undefined;

  const lines = text.split('\n');
  for (const line of lines) {
    if (amountKeywords.test(line)) {
      const nums = [...line.matchAll(/[\d,]+\.?\d*/g)].map(m => parseFloat(m[0].replace(/,/g, '')));
      if (nums.length > 0) {
        const candidate = Math.max(...nums);
        if (!isNaN(candidate) && candidate > 0) {
          amount = candidate;
          break;
        }
      }
    }
  }

  if (amount === undefined) {
    const decimals = [...text.matchAll(/[\d,]+\.\d+/g)].map(m => parseFloat(m[0].replace(/,/g, '')));
    if (decimals.length > 0) {
      amount = Math.max(...decimals.filter(n => !isNaN(n) && n > 0));
      if (isNaN(amount)) amount = undefined;
    }
  }

  let currency = defaultCurrency;
  if (/BDT|৳|টাকা/.test(text)) {
    currency = 'BDT';
  } else if (/\$|USD/.test(text)) {
    currency = 'USD';
  }

  let date = new Date().toISOString().slice(0, 10);
  const datePatterns = [
    { re: /(\d{4})-(\d{2})-(\d{2})/, fmt: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` },
    { re: /(\d{2})\/(\d{2})\/(\d{4})/, fmt: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },
    { re: /(\d{2})-(\d{2})-(\d{4})/, fmt: (m: RegExpMatchArray) => `${m[3]}-${m[2]}-${m[1]}` },
    { re: /(\d{2})\/(\d{2})\/(\d{4})/, fmt: (m: RegExpMatchArray) => `${m[3]}-${m[1]}-${m[2]}` },
  ];
  for (const { re, fmt } of datePatterns) {
    const m = text.match(re);
    if (m) {
      date = fmt(m);
      break;
    }
  }

  let merchant: string | undefined;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 3 && !/^\d+$/.test(trimmed)) {
      merchant = trimmed;
      break;
    }
  }

  let category = 'Other';
  if (/restaurant|cafe|food|dining|pizza|burger|coffee|খাবার|রেস্তোরাঁ/i.test(text)) {
    category = 'Food & Dining';
  } else if (/uber|pathao|taxi|fuel|petrol|bus|rickshaw|পরিবহন/i.test(text)) {
    category = 'Transport';
  } else if (/pharmacy|hospital|clinic|doctor|medicine|ওষুধ/i.test(text)) {
    category = 'Health';
  } else if (/electric|water|internet|phone|bill|বিল/i.test(text)) {
    category = 'Utilities';
  } else if (/shop|store|mart|market|বাজার/i.test(text)) {
    category = 'Shopping';
  } else if (/cinema|movie|ticket|game/i.test(text)) {
    category = 'Entertainment';
  }

  const result: Partial<ExtractedTransaction> = { currency, date, category };
  if (amount !== undefined) result.amount = amount;
  if (merchant !== undefined) result.merchant = merchant;

  return result;
}

export async function extractFromReceiptImage(base64: string, defaultCurrency: string): Promise<ExtractedTransaction> {
  const { text, confidence } = await recognizeReceiptText(base64);
  const parsed = parseReceiptText(text, defaultCurrency);

  return {
    amount: parsed.amount ?? 0,
    currency: parsed.currency ?? defaultCurrency,
    category: parsed.category ?? 'Other',
    date: parsed.date ?? new Date().toISOString().slice(0, 10),
    merchant: parsed.merchant,
    note: parsed.note,
    confidence: Math.min(confidence, 0.95),
  };
}
