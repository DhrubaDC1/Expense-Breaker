import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Currency } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
  const model = "gemini-3-flash-preview";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: `Extract transaction details from this receipt image. 
          Return a JSON object with: amount (number), currency (ISO string), category (one of: Food & Dining, Transport, Entertainment, Shopping, Utilities, Health, Other), date (YYYY-MM-DD), merchant (string), note (string). 
          Also include a 'confidence' score between 0 and 1.`,
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            category: { type: Type.STRING },
            date: { type: Type.STRING },
            merchant: { type: Type.STRING },
            note: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["amount", "currency", "date"],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    return data as ExtractedTransaction;
  } catch (error) {
    console.error("AI OCR Error:", error);
    return null;
  }
}

export async function parseSmartImport(text: string): Promise<ExtractedTransaction[]> {
  const model = "gemini-3-flash-preview";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Parse the following text and extract a list of transactions. 
      Input text: "${text}"
      
      Return a JSON array of objects with: amount, currency, category, date (YYYY-MM-DD), merchant, note.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              category: { type: Type.STRING },
              date: { type: Type.STRING },
              merchant: { type: Type.STRING },
              note: { type: Type.STRING },
            },
            required: ["amount", "currency", "date"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || '[]');
    return data as ExtractedTransaction[];
  } catch (error) {
    console.error("AI Smart Import Error:", error);
    return [];
  }
}

export async function extractTransactionsFromMultipleImages(base64Images: string[]): Promise<ExtractedTransaction[]> {
  const model = "gemini-3-flash-preview";
  
  try {
    const contents: any[] = base64Images.map(base64 => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64,
      },
    }));

    contents.push({
      text: `Extract transaction details from these receipt images. 
      Return a JSON array of objects with: amount (number), currency (ISO string), category (one of: Food & Dining, Transport, Entertainment, Shopping, Utilities, Health, Other), date (YYYY-MM-DD), merchant (string), note (string). 
      Process each image as a separate transaction.`,
    });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              category: { type: Type.STRING },
              date: { type: Type.STRING },
              merchant: { type: Type.STRING },
              note: { type: Type.STRING },
            },
            required: ["amount", "currency", "date"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || '[]');
    return data as ExtractedTransaction[];
  } catch (error) {
    console.error("AI Multi-OCR Error:", error);
    return [];
  }
}
