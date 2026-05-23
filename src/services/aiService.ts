import { onDeviceEngine } from './onDeviceEngine';
import { extractFromReceiptImage } from './tesseractOcr';

export interface ExtractedTransaction {
  amount: number;
  currency: string;
  category: string;
  date: string;
  merchant?: string;
  note?: string;
  confidence: number;
}

export async function extractTransactionFromImage(base64Image: string): Promise<ExtractedTransaction | null> {
  try {
    return await extractFromReceiptImage(base64Image, 'BDT');
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
}

export async function parseSmartImport(text: string): Promise<ExtractedTransaction[]> {
  const systemPrompt = `You are a transaction parser. Extract transactions from user-provided text or CSV.

Categories for expenses: Food & Dining, Transport, Entertainment, Shopping, Utilities, Health, Other
Categories for income: Salary, Freelance, Investment

Output ONLY a valid JSON array. No explanation, no markdown, no text outside the array.
Each element must have exactly these fields:
- amount: number (positive)
- currency: string (ISO 4217 code, e.g. USD, BDT)
- category: string (must be one of the categories listed above)
- date: string (YYYY-MM-DD; use today's date if not specified: ${new Date().toISOString().slice(0, 10)})
- note: string
- confidence: number between 0 and 1

Example: [{"amount":12.50,"currency":"USD","category":"Food & Dining","date":"2026-05-23","note":"Lunch","confidence":0.9}]`;

  try {
    if (onDeviceEngine.state !== 'ready') {
      await onDeviceEngine.init();
    }
    const raw = await onDeviceEngine.chat(
      [{ role: 'user', content: text }],
      systemPrompt
    );
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    if (Array.isArray(parsed)) return parsed as ExtractedTransaction[];
    return [];
  } catch (error) {
    console.error('AI Smart Import Error:', error);
    return [];
  }
}

export async function chatWithCoach(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string
): Promise<string> {
  if (onDeviceEngine.state !== 'ready') {
    await onDeviceEngine.init();
  }
  return onDeviceEngine.chat(
    messages.map(m => ({ role: m.role, content: m.content })),
    systemPrompt
  );
}

export async function extractTransactionsFromMultipleImages(base64Images: string[]): Promise<ExtractedTransaction[]> {
  return Promise.all(base64Images.map(b64 => extractFromReceiptImage(b64, 'BDT')));
}
