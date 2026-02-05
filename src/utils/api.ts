// API调用工具
import axios, { AxiosError } from 'axios';
import type { APIResponse, StreamResponse, Message, ModelConfig, APIError } from '../types';

// SiliconFlow API基础URL
const API_BASE_URL = 'https://api.siliconflow.cn/v1';

/**
 * 创建axios实例
 */
const createAxiosInstance = (apiKey: string) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  });
};

/**
 * 发送聊天请求
 */
export const sendChatRequest = async (
  apiKey: string,
  messages: Message[],
  modelConfig: ModelConfig
): Promise<APIResponse> => {
  const instance = createAxiosInstance(apiKey);
  
  try {
    const response = await instance.post<APIResponse>('/chat/completions', {
      model: modelConfig.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.max_tokens,
      stream: false,
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;
      throw new Error(axiosError.response?.data?.message || 'API请求失败');
    }
    throw new Error('网络请求失败');
  }
};

/**
 * 发送流式聊天请求
 */
export const sendStreamChatRequest = (
  apiKey: string,
  messages: Message[],
  modelConfig: ModelConfig,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): () => void => {
  const instance = createAxiosInstance(apiKey);
  let controller = new AbortController();
  
  const fetchStream = async () => {
    try {
      const response = await instance.post('/chat/completions', {
        model: modelConfig.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens,
        stream: true,
      }, {
        responseType: 'stream',
        signal: controller.signal,
      });
      
      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete();
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              onComplete();
              return;
            }
            try {
              const data = JSON.parse(dataStr) as StreamResponse;
              const content = data.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (error) {
              console.error('解析流式响应失败:', error);
            }
          }
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        onError(error instanceof Error ? error : new Error('流式请求失败'));
      }
    }
  };
  
  fetchStream();
  
  // 返回中止函数
  return () => {
    controller.abort();
  };
};

/**
 * 获取可用模型列表
 */
export const getAvailableModels = async (apiKey: string): Promise<Array<{ id: string; name: string }>> => {
  const instance = createAxiosInstance(apiKey);
  
  try {
    const response = await instance.get('/models');
    return response.data.data.map((model: any) => ({
      id: model.id,
      name: model.id,
    }));
  } catch (error) {
    console.error('获取模型列表失败:', error);
    // 返回默认模型
    return [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
    ];
  }
};