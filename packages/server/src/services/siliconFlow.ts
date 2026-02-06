// SiliconFlow API服务
import axios, { AxiosError } from 'axios';
import type { APIResponse, StreamResponse, ChatRequest, APIError, ModelInfo } from '../types';

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
  request: ChatRequest
): Promise<APIResponse> => {
  const instance = createAxiosInstance(apiKey);
  
  try {
    const response = await instance.post<APIResponse>('/chat/completions', request);
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
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): (() => void) => {
  const instance = createAxiosInstance(apiKey);
  const controller = new AbortController();
  
  // 简化的流式请求处理
  const fetchStream = async () => {
    try {
      // 发送请求
      const response = await instance.post('/chat/completions', request, {
        responseType: 'stream',
        signal: controller.signal,
      });
      
      // 检查响应
      if (!response.data) {
        throw new Error('响应数据为空');
      }
      
      const stream = response.data;
      const decoder = new TextDecoder();
      let buffer = '';
      
      // 监听数据流
      stream.on('data', (chunk: Buffer) => {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        // 处理每一行
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              onComplete();
              return;
            }
            
            try {
              const data = JSON.parse(dataStr);
              
              // 检查错误
              if (data.error) {
                onError(new Error(data.error.message || 'API请求失败'));
                return;
              }
              
              // 安全地获取content
              if (data.choices && Array.isArray(data.choices)) {
                const choice = data.choices[0];
                if (choice && choice.delta && choice.delta.content) {
                  onChunk(choice.delta.content);
                }
              }
            } catch (error) {
              console.error('解析流式响应失败:', error);
            }
          }
        }
      });
      
      // 监听流结束
      stream.on('end', () => {
        onComplete();
      });
      
      // 监听流错误
      stream.on('error', (error: Error) => {
        if (!controller.signal.aborted) {
          onError(error);
        }
      });
    } catch (error) {
      console.error('流式请求失败:', error);
      if (!controller.signal.aborted) {
        onError(error instanceof Error ? error : new Error('流式请求失败'));
      }
    }
  };
  
  // 启动请求
  fetchStream();
  
  // 返回中止函数
  return () => controller.abort();
};

/**
 * 获取可用模型列表
 */
export const getAvailableModels = async (apiKey: string): Promise<ModelInfo[]> => {
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
