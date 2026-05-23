import { CreateMLCEngine, MLCEngine, InitProgressReport, prebuiltAppConfig } from '@mlc-ai/web-llm';

export type EngineState = 'idle' | 'downloading' | 'loading' | 'ready' | 'error';

export const MODELS = {
  'Llama-3.2-3B-Instruct-q4f16_1-MLC': {
    label: 'Llama 3.2 3B',
    description: '~1.8 GB · balanced text & chat',
    vision: false,
  },
  'dixieclick/Qwen3.5-0.8B-VL-q4f16_1-MLC': {
    label: 'Qwen 3.5 0.8B VL',
    description: '~0.5 GB · compact, vision-capable',
    vision: true,
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

function buildAppConfig(modelId: ModelId) {
  if (prebuiltAppConfig.model_list.some(m => m.model_id === modelId)) {
    return prebuiltAppConfig;
  }
  // Custom HuggingFace model — reuse the Qwen2-VL model_lib if available
  const qwenVLLib = prebuiltAppConfig.model_list.find(
    m => /Qwen.*VL/i.test(m.model_id)
  )?.model_lib ?? '';
  return {
    ...prebuiltAppConfig,
    model_list: [
      ...prebuiltAppConfig.model_list,
      {
        model: `https://huggingface.co/${modelId}`,
        model_id: modelId,
        model_lib: qwenVLLib,
      },
    ],
  };
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
          appConfig: buildAppConfig(modelId),
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
