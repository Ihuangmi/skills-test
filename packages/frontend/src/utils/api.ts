// API调用工具
import axios, { AxiosError } from 'axios';
import type {
  APIResponse,
  Message,
  ModelConfig,
  APIError,
} from '../types';

const UPSTREAM_BASE_URL_HEADER = 'X-Model-Base-Url';

// 获取API基础URL（开发环境用代理，生产环境用实际服务端地址）
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_SERVER_URL || 'https://your-server.onrender.com/api/v1';
  }

  return '/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

const createRequestHeaders = (apiKey: string, baseUrl?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (baseUrl?.trim()) {
    headers[UPSTREAM_BASE_URL_HEADER] = baseUrl.trim();
  }

  return headers;
};

/**
 * 创建axios实例
 */
const createAxiosInstance = (apiKey: string, baseUrl?: string) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: createRequestHeaders(apiKey, baseUrl),
  });
};

/**
 * 发送聊天请求
 */
export const sendChatRequest = async (
  apiKey: string,
  messages: Message[],
  modelConfig: ModelConfig,
  baseUrl?: string,
): Promise<APIResponse> => {
  const instance = createAxiosInstance(apiKey, baseUrl);

  try {
    const response = await instance.post<APIResponse>('/chat/completions', {
      model: modelConfig.model,
      messages: messages.map((msg) => ({
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
  baseUrl: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
): (() => void) => {
  const controller = new AbortController();
  const signal = controller.signal;

  const fetchStream = async () => {
    try {
      const requestData = {
        model: modelConfig.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens,
        stream: true,
      };

      console.log('发送流式请求:', {
        url: `${API_BASE_URL}/chat/completions`,
        apiKey: apiKey ? '***' + apiKey.slice(-4) : '空',
        model: modelConfig.model,
        baseUrl: baseUrl || '默认',
        messageCount: messages.length,
        stream: true,
      });

      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: createRequestHeaders(apiKey, baseUrl),
        body: JSON.stringify(requestData),
        signal,
      });

      console.log('响应状态:', response.status, response.statusText);

      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.log('错误响应:', errorData);
          throw new Error(errorData.error?.message || 'API请求失败');
        } catch (e) {
          console.log('解析错误响应失败:', e);
          throw new Error(`请求失败: ${response.status}`);
        }
      }

      if (!response.body) {
        throw new Error('响应体为空');
      }

      const reader = response.body.getReader();
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
              const data = JSON.parse(dataStr);

              if (data.error) {
                throw new Error(data.error.message || 'API请求失败');
              }

              if (data.choices && Array.isArray(data.choices)) {
                const choice = data.choices[0];
                if (choice && choice.delta && choice.delta.content) {
                  onChunk(choice.delta.content);
                }
              }
            } catch (error) {
              console.error('解析响应失败:', error);
              if (!signal.aborted) {
                onError(
                  error instanceof Error ? error : new Error('解析响应失败'),
                );
              }
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('流式请求失败:', error);
      if (!signal.aborted) {
        onError(error instanceof Error ? error : new Error('流式请求失败'));
      }
    }
  };

  void fetchStream();

  return () => controller.abort();
};

/**
 * 获取可用模型列表
 */
export const getAvailableModels = async (
  apiKey: string,
  baseUrl?: string,
): Promise<Array<{ id: string; name: string }>> => {
  const instance = createAxiosInstance(apiKey, baseUrl);

  try {
    const response = await instance.get('/models');
    return response.data.data.map((model: { id: string }) => ({
      id: model.id,
      name: model.id,
    }));
  } catch (error) {
    console.error('获取模型列表失败:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;
      throw new Error(axiosError.response?.data?.message || '获取模型列表失败');
    }
    throw new Error('获取模型列表失败');
  }
};
