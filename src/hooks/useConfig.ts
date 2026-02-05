// 配置管理钩子
import { create } from 'zustand';
import type { UserConfig, ModelConfig } from '../types';
import { saveAPIKey, getAPIKey, saveUserConfig, getUserConfig } from '../utils/storage';
import { getAvailableModels } from '../utils/api';

interface ConfigState {
  // 配置数据
  apiKey: string;
  modelConfig: ModelConfig;
  availableModels: Array<{ id: string; name: string }>;
  
  // 状态
  isLoading: boolean;
  error: string | null;
  
  // 操作
  setAPIKey: (apiKey: string) => void;
  setModelConfig: (config: Partial<ModelConfig>) => void;
  fetchAvailableModels: () => Promise<void>;
  resetConfig: () => void;
}

// 默认模型配置
const DEFAULT_MODEL_CONFIG: ModelConfig = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  max_tokens: 1000,
};

// 默认可用模型
const DEFAULT_AVAILABLE_MODELS = [
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'gpt-4', name: 'GPT-4' },
];

// 从本地存储加载配置
const loadConfig = (): UserConfig => {
  const apiKey = getAPIKey();
  const storedConfig = getUserConfig({});
  
  return {
    apiKey,
    modelConfig: {
      ...DEFAULT_MODEL_CONFIG,
      ...storedConfig.modelConfig,
    },
  };
};

// 创建配置存储
export const useConfig = create<ConfigState>((set, get) => ({
  // 初始状态
  apiKey: loadConfig().apiKey,
  modelConfig: loadConfig().modelConfig,
  availableModels: DEFAULT_AVAILABLE_MODELS,
  isLoading: false,
  error: null,
  
  // 设置API Key
  setAPIKey: (apiKey) => {
    set({ apiKey });
    saveAPIKey(apiKey);
    // 当API Key变化时，重新获取可用模型
    get().fetchAvailableModels();
  },
  
  // 设置模型配置
  setModelConfig: (config) => {
    const newConfig = {
      ...get().modelConfig,
      ...config,
    };
    set({ modelConfig: newConfig });
    saveUserConfig({ modelConfig: newConfig });
  },
  
  // 获取可用模型列表
  fetchAvailableModels: async () => {
    const { apiKey } = get();
    if (!apiKey) {
      set({ availableModels: DEFAULT_AVAILABLE_MODELS });
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const models = await getAvailableModels(apiKey);
      set({ availableModels: models, isLoading: false });
    } catch (error) {
      console.error('获取模型列表失败:', error);
      set({ 
        availableModels: DEFAULT_AVAILABLE_MODELS,
        error: '获取模型列表失败，使用默认模型',
        isLoading: false 
      });
    }
  },
  
  // 重置配置
  resetConfig: () => {
    const defaultConfig = {
      apiKey: '',
      modelConfig: DEFAULT_MODEL_CONFIG,
      availableModels: DEFAULT_AVAILABLE_MODELS,
    };
    set(defaultConfig);
    saveAPIKey('');
    saveUserConfig({ modelConfig: DEFAULT_MODEL_CONFIG });
  },
}));

// 导出默认模型配置
export { DEFAULT_MODEL_CONFIG };