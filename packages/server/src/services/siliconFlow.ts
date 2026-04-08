// OpenAI 兼容模型服务
import axios, { AxiosError } from 'axios';
import { isIP } from 'node:net';
import type {
  APIResponse,
  ChatRequest,
  APIError,
  ModelInfo,
} from '../types';

const DEFAULT_API_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
  '169.254.169.254',
  'metadata.google.internal',
]);

const IPV4_PRIVATE_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
];

const IPV6_PRIVATE_PATTERNS = [/^::1$/i, /^fc/i, /^fd/i, /^fe80:/i];

const isPrivateIpAddress = (hostname: string) => {
  const ipVersion = isIP(hostname);

  if (ipVersion === 4) {
    return IPV4_PRIVATE_PATTERNS.some((pattern) => pattern.test(hostname));
  }

  if (ipVersion === 6) {
    return IPV6_PRIVATE_PATTERNS.some((pattern) => pattern.test(hostname));
  }

  return false;
};

const sanitizeBaseUrl = (baseUrl?: string) => {
  if (!baseUrl?.trim()) {
    return DEFAULT_API_BASE_URL;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(baseUrl.trim());
  } catch {
    throw new Error('Base URL 格式不正确');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Base URL 仅支持 http 或 https 协议');
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error('Base URL 不支持内嵌认证信息');
  }

  if (parsedUrl.search || parsedUrl.hash) {
    throw new Error('Base URL 不能包含查询参数或片段');
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    isPrivateIpAddress(hostname)
  ) {
    throw new Error('Base URL 不允许使用本地或内网地址');
  }

  parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';

  return parsedUrl.toString().replace(/\/$/, '');
};

/**
 * 创建axios实例
 */
const createAxiosInstance = (apiKey: string, baseUrl?: string) => {
  return axios.create({
    baseURL: sanitizeBaseUrl(baseUrl),
    timeout: 120000,
    maxRedirects: 0,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
};

/**
 * 发送聊天请求
 */
export const sendChatRequest = async (
  apiKey: string,
  request: ChatRequest,
  baseUrl?: string,
): Promise<APIResponse> => {
  try {
    const instance = createAxiosInstance(apiKey, baseUrl);
    const response = await instance.post<APIResponse>('/chat/completions', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;
      throw new Error(axiosError.response?.data?.message || 'API请求失败');
    }
    throw error instanceof Error ? error : new Error('网络请求失败');
  }
};

/**
 * 发送流式聊天请求
 */
export const sendStreamChatRequest = (
  apiKey: string,
  request: ChatRequest,
  baseUrl: string | undefined,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
): (() => void) => {
  const controller = new AbortController();

  const fetchStream = async () => {
    try {
      const instance = createAxiosInstance(apiKey, baseUrl);
      const response = await instance.post('/chat/completions', request, {
        responseType: 'stream',
        signal: controller.signal,
      });

      if (!response.data) {
        throw new Error('响应数据为空');
      }

      const stream = response.data;
      const decoder = new TextDecoder();
      let buffer = '';

      stream.on('data', (chunk: Buffer) => {
        buffer += decoder.decode(chunk, { stream: true });
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
                onError(new Error(data.error.message || 'API请求失败'));
                return;
              }

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

      stream.on('end', () => {
        onComplete();
      });

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

  void fetchStream();

  return () => controller.abort();
};

/**
 * 获取可用模型列表
 */
export const getAvailableModels = async (
  apiKey: string,
  baseUrl?: string,
): Promise<ModelInfo[]> => {
  try {
    const instance = createAxiosInstance(apiKey, baseUrl);
    const response = await instance.get('/models');
    return response.data.data.map((model: { id: string }) => ({
      id: model.id,
      name: model.id,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;
      throw new Error(axiosError.response?.data?.message || '获取模型列表失败');
    }
    throw error instanceof Error ? error : new Error('获取模型列表失败');
  }
};
