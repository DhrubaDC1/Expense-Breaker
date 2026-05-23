import { CreateMLCEngine, MLCEngine, InitProgressReport, prebuiltAppConfig } from '@mlc-ai/web-llm';

export type EngineState = 'idle' | 'downloading' | 'loading' | 'ready' | 'error';

export const MODELS = {
  'Llama-3.2-3B-Instruct-q4f16_1-MLC': {
    label: 'Llama 3.2 3B',
    description: '~1.8 GB · balanced text & chat',
  },
  'Qwen3-0.6B-q4f16_1-MLC': {
    label: 'Qwen3 0.6B',
    description: '~0.4 GB · compact & fast',
  },
} as const;

export type ModelId = keyof typeof MODELS;

const STORAGE_KEY = 'ai-model';
export const DEFAULT_MODEL: ModelId = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

export function getSelectedModel(): ModelId {
  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored && stored in MODELS) ? stored as ModelId : DEFAULT_MODEL;
}

export function setSelectedModel(id: ModelId): void {
  localStorage.setItem(STORAGE_KEY, id);
}


interface OnDeviceEngine {
  state: EngineState;
  progress: number;
  init(onProgress?: (state: EngineState, progress: number) => void): Promise<void>;
  chat(messages: { role: string; content: string }[], systemPrompt: string): Promise<string>;
  reset(): void;
}

let engine: MLCEngine | null = null;
let initPromise: Promise<void> | null = null;

export const onDeviceEngine: OnDeviceEngine = {
  state: 'idle',
  progress: 0,

  reset(): void {
    engine = null;
    initPromise = null;
    onDeviceEngine.state = 'idle';
    onDeviceEngine.progress = 0;
  },

  async init(onProgress?: (state: EngineState, progress: number) => void): Promise<void> {
    if (onDeviceEngine.state === 'ready') return;
    if (initPromise) return initPromise;

    const modelId = getSelectedModel();

    initPromise = (async () => {
      try {
        onDeviceEngine.state = 'downloading';
        onDeviceEngine.progress = 0;
        onProgress?.('downloading', 0);

        engine = await CreateMLCEngine(modelId, {
          appConfig: prebuiltAppConfig,
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
