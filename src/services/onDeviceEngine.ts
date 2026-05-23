import { CreateMLCEngine, MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

export type EngineState = 'idle' | 'downloading' | 'loading' | 'ready' | 'error';

const MODEL_ID = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

interface OnDeviceEngine {
  state: EngineState;
  progress: number;
  init(onProgress?: (state: EngineState, progress: number) => void): Promise<void>;
  chat(messages: { role: string; content: string }[], systemPrompt: string): Promise<string>;
}

let engine: MLCEngine | null = null;
let initPromise: Promise<void> | null = null;

export const onDeviceEngine: OnDeviceEngine = {
  state: 'idle',
  progress: 0,

  async init(onProgress?: (state: EngineState, progress: number) => void): Promise<void> {
    if (onDeviceEngine.state === 'ready') return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        onDeviceEngine.state = 'downloading';
        onDeviceEngine.progress = 0;
        onProgress?.('downloading', 0);

        engine = await CreateMLCEngine(MODEL_ID, {
          initProgressCallback: (report: InitProgressReport) => {
            const pct = Math.round(report.progress * 100);
            const nextState: EngineState = report.progress < 1 ? 'downloading' : 'loading';
            onDeviceEngine.state = nextState;
            onDeviceEngine.progress = pct;
            onProgress?.(nextState, pct);
          },
        });

        onDeviceEngine.state = 'ready';
        onDeviceEngine.progress = 100;
        onProgress?.('ready', 100);
      } catch (err) {
        console.error('WebLLM init error:', err);
        onDeviceEngine.state = 'error';
        initPromise = null;
        throw err;
      }
    })();

    return initPromise;
  },

  async chat(
    messages: { role: string; content: string }[],
    systemPrompt: string
  ): Promise<string> {
    if (!engine || onDeviceEngine.state !== 'ready') {
      throw new Error('Engine not ready');
    }

    const response = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
      ],
      stream: false,
    });

    return response.choices[0]?.message?.content?.trim() ?? '';
  },
};
