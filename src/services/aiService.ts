import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY || '', 
  dangerouslyAllowBrowser: true 
});

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
  const model = "meta-llama/llama-4-scout-17b-16e-instruct";
  
  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract transaction details from this receipt image. 
              Return a JSON object with: amount (number), currency (ISO string), category (one of: Food & Dining, Transport, Entertainment, Shopping, Utilities, Health, Other), date (YYYY-MM-DD), merchant (string), note (string). 
              Also include a 'confidence' score between 0 and 1. Do not include any text outside of the JSON.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    const data = JSON.parse(content || '{}');
    return data as ExtractedTransaction;
  } catch (error) {
    console.error("AI OCR Error:", error);
    return null;
  }
}

export async function parseSmartImport(text: string): Promise<ExtractedTransaction[]> {
  const model = "meta-llama/llama-4-scout-17b-16e-instruct";
  
  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: `Parse the following text and extract a list of transactions. 
          Input text: "${text}"
          
          Return a JSON object containing an array called "transactions", where each element is an object with: amount (number), currency (string), category (string), date (YYYY-MM-DD), merchant (string), note (string), confidence (number).`
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    const data = JSON.parse(content || '{"transactions":[]}');
    
    if (data.transactions) {
      return data.transactions as ExtractedTransaction[];
    } else if (Array.isArray(data)) {
      return data as ExtractedTransaction[];
    }
    return [];
  } catch (error) {
    console.error("AI Smart Import Error:", error);
    return [];
  }
}

export async function chatWithCoach(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string
): Promise<string> {
  const model = 'meta-llama/llama-4-scout-17b-16e-instruct';
  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
    });
    return response.choices[0]?.message?.content?.trim() || "I couldn't process that. Try again?";
  } catch (error) {
    console.error('Coach chat error:', error);
    throw error;
  }
}

export async function extractTransactionsFromMultipleImages(base64Images: string[]): Promise<ExtractedTransaction[]> {
  const model = "meta-llama/llama-4-scout-17b-16e-instruct";
  
  try {
    const contentPayload: any[] = [
      {
        type: "text",
        text: `Extract transaction details from these receipt images. 
        Return a JSON object containing an array called "transactions", where each element is an object with: amount (number), currency (ISO string), category (one of: Food & Dining, Transport, Entertainment, Shopping, Utilities, Health, Other), date (YYYY-MM-DD), merchant (string), note (string), confidence (number). 
        Process each image as a separate transaction.`
      }
    ];

    base64Images.forEach(base64 => {
      contentPayload.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64}`
        }
      });
    });

    const response = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: contentPayload,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    const data = JSON.parse(content || '{"transactions":[]}');
    if (data.transactions) {
      return data.transactions as ExtractedTransaction[];
    } else if (Array.isArray(data)) {
      return data as ExtractedTransaction[];
    }
    return [];
  } catch (error) {
    console.error("AI Multi-OCR Error:", error);
    return [];
  }
}
