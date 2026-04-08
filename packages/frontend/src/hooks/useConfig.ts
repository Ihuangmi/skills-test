// 配置管理钩子
import { create } from 'zustand';
import type { UserConfig, ModelConfig } from '../types';
import { saveAPIKey, getAPIKey, saveUserConfig, getUserConfig } from '../utils/storage';
import { getAvailableModels } from '../utils/api';

interface ConfigState {
  // 配置数据
  apiKey: string;
  baseUrl: string;
  modelConfig: ModelConfig;
  availableModels: Array<{ id: string; name: string }>;
  
  // 状态
  isLoading: boolean;
  error: string | null;
  
  // 操作
  setAPIKey: (apiKey: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  saveConnectionConfig: (apiKey: string, baseUrl: string) => Promise<void>;
  setModelConfig: (config: Partial<ModelConfig>) => void;
  fetchAvailableModels: () => Promise<void>;
  resetConfig: () => void;
}

// 默认模型配置
const DEFAULT_MODEL_CONFIG: ModelConfig = {
  model: 'qwen-turbo',
  temperature: 0.7,
  max_tokens: 1000,
};

const DEFAULT_BASE_URL = '';
const DEFAULT_AVAILABLE_MODELS: Array<{ id: string; name: string }> = [];

const persistUserConfig = (baseUrl: string, modelConfig: ModelConfig) => {
  saveUserConfig({
    baseUrl,
    modelConfig,
  });
};

// 从本地存储加载配置
const loadConfig = (): UserConfig => {
  const apiKey = getAPIKey();
  const storedConfig = getUserConfig({});
  
  return {
    apiKey,
    baseUrl: typeof storedConfig.baseUrl === 'string' ? storedConfig.baseUrl : DEFAULT_BASE_URL,
    modelConfig: {
      ...DEFAULT_MODEL_CONFIG,
      ...storedConfig.modelConfig,
    },
  };
};

const initialConfig = loadConfig();

// 创建配置存储
export const useConfig = create<ConfigState>((set, get) => ({
  // 初始状态
  apiKey: initialConfig.apiKey,
  baseUrl: initialConfig.baseUrl,
  modelConfig: initialConfig.modelConfig,
  availableModels: DEFAULT_AVAILABLE_MODELS,
  isLoading: false,
  error: null,
  
  // 设置API Key
  setAPIKey: (apiKey) => {
    set({ apiKey });
    saveAPIKey(apiKey);
    persistUserConfig(get().baseUrl, get().modelConfig);
    void get().fetchAvailableModels();
  },

  // 设置Base URL
  setBaseUrl: (baseUrl) => {
    set({ baseUrl });
    persistUserConfig(baseUrl, get().modelConfig);
    void get().fetchAvailableModels();
  },

  // 保存连接配置
  saveConnectionConfig: async (apiKey, baseUrl) => {
    set({ apiKey, baseUrl });
    saveAPIKey(apiKey);
    persistUserConfig(baseUrl, get().modelConfig);
    await get().fetchAvailableModels();
  },
  
  // 设置模型配置
  setModelConfig: (config) => {
    const newConfig = {
      ...get().modelConfig,
      ...config,
    };
    set({ modelConfig: newConfig });
    persistUserConfig(get().baseUrl, newConfig);
  },
  
  // 获取可用模型列表
  fetchAvailableModels: async () => {
    const { apiKey, baseUrl } = get();
    if (!apiKey) {
      set({ availableModels: DEFAULT_AVAILABLE_MODELS, error: null, isLoading: false });
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const models = await getAvailableModels(apiKey, baseUrl);
      set({ availableModels: models, isLoading: false });
    } catch (error) {
      console.error('获取模型列表失败:', error);
      set({ 
        availableModels: DEFAULT_AVAILABLE_MODELS,
        error: error instanceof Error ? error.message : '获取模型列表失败，可手动输入模型名',
        isLoading: false 
      });
    }
  },
  
  // 重置配置
  resetConfig: () => {
    const defaultConfig = {
      apiKey: '',
      baseUrl: DEFAULT_BASE_URL,
      modelConfig: DEFAULT_MODEL_CONFIG,
      availableModels: DEFAULT_AVAILABLE_MODELS,
      error: null,
      isLoading: false,
    };
    set(defaultConfig);
    saveAPIKey('');
    persistUserConfig(DEFAULT_BASE_URL, DEFAULT_MODEL_CONFIG);
  },
}));

// 导出默认模型配置
export { DEFAULT_MODEL_CONFIG, DEFAULT_BASE_URL };
