/**
 * AI Chat Hook - 可复用的聊天逻辑封装
 *
 * 使用示例:
 * ```tsx
 * const { messages, isLoading, sendMessage } = useAIChat({
 *   apiEndpoint: '/api/chat',
 *   apiKey: 'your-key',
 * });
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface UseAIChatOptions {
  /** API 端点 */
  apiEndpoint: string;
  /** API Key（可选，有些服务不需要） */
  apiKey?: string;
  /** 模型名称 */
  model?: string;
  /** 系统提示词 */
  systemPrompt?: string;
  /** 流式内容回调 */
  onChunk?: (text: string) => void;
  /** 完成回调 */
  onComplete?: (fullText: string) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

export interface UseAIChatReturn {
  /** 消息列表 */
  messages: Message[];
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 发送消息 */
  sendMessage: (content: string) => Promise<void>;
  /** 停止生成 */
  stopGeneration: () => void;
  /** 清空历史 */
  clearHistory: () => void;
  /** 删除指定消息 */
  deleteMessage: (index: number) => void;
  /** 重新生成最后一条回复 */
  regenerate: () => Promise<void>;
}

export function useAIChat(options: UseAIChatOptions): UseAIChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastValidMessagesRef = useRef<Message[]>([]);

  // 清理挂载时的控制器
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setError(null);
    setIsLoading(true);

    const userMessage: Message = { role: 'user', content: content.trim() };

    // 保存当前消息状态用于可能的重试
    lastValidMessagesRef.current = [...messages];

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);

    // 预占位助手消息
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 构建实际发送的消息（包含 system prompt）
      const messagesToSend: Message[] = [];

      if (options.systemPrompt) {
        messagesToSend.push({ role: 'system', content: options.systemPrompt });
      }
      messagesToSend.push(...messages, userMessage);

      const response = await fetch(options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.apiKey && { 'Authorization': `Bearer ${options.apiKey}` }),
        },
        body: JSON.stringify({
          model: options.model || 'Qwen/Qwen2.5-72B-Instruct',
          messages: messagesToSend,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('响应体为空');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let incompleteLine = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // 解码chunk
        const chunk = decoder.decode(value, { stream: true });
        const lines = incompleteLine + chunk;
        const lineArray = lines.split('\n');

        // 保留最后一行可能不完整的
        incompleteLine = lineArray.pop() || '';

        for (const line of lineArray) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.slice(6);

            // 结束标记
            if (dataStr === '[DONE]') {
              break;
            }

            try {
              const data = JSON.parse(dataStr);

              // 检查 API 错误
              if (data.error) {
                throw new Error(data.error.message || 'API Error');
              }

              // 提取内容
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;

                // 回调
                options.onChunk?.(delta);

                // 更新 UI - 使用函数式更新确保拿到最新状态
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg?.role === 'assistant') {
                    newMessages[newMessages.length - 1] = {
                      ...lastMsg,
                      content: lastMsg.content + delta,
                    };
                  }
                  return newMessages;
                });
              }
            } catch (parseError) {
              console.warn('JSON parse error:', parseError, 'Raw data:', dataStr);
            }
          }
        }
      }

      // 完成回调
      options.onComplete?.(fullText);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';

      // 忽略中止错误
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      setError(errorMsg);
      options.onError?.(err instanceof Error ? err : new Error(errorMsg));

      // 移除失败的助手消息
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, options]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    lastValidMessagesRef.current = [];
  }, []);

  const deleteMessage = useCallback((index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const regenerate = useCallback(async () => {
    // 找到最后一个用户消息
    const lastUserMessageIndex = messages.findLastIndex(m => m.role === 'user');

    if (lastUserMessageIndex === -1) {
      setError('没有可重新生成的消息');
      return;
    }

    // 删除最后一条助手消息（如果有）
    const newMessages = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(newMessages);

    // 重新发送
    const lastUserMessage = messages[lastUserMessageIndex];
    // 临时绕过 messages 依赖
    lastValidMessagesRef.current = newMessages.slice(0, -1);

    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const messagesToSend: Message[] = [];

      if (options.systemPrompt) {
        messagesToSend.push({ role: 'system', content: options.systemPrompt });
      }
      messagesToSend.push(...newMessages.slice(0, -1));

      const response = await fetch(options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.apiKey && { 'Authorization': `Bearer ${options.apiKey}` }),
        },
        body: JSON.stringify({
          model: options.model || 'Qwen/Qwen2.5-72B-Instruct',
          messages: messagesToSend,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let incompleteLine = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = incompleteLine + chunk;
        const lineArray = lines.split('\n');
        incompleteLine = lineArray.pop() || '';

        for (const line of lineArray) {
          if (line.trim().startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.trim().slice(6));
              const delta = data.choices?.[0]?.delta?.content || '';
              fullText += delta;
              options.onChunk?.(delta);

              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = {
                  ...newMsgs[newMsgs.length - 1],
                  content: newMsgs[newMsgs.length - 1].content + delta,
                };
                return newMsgs;
              });
            } catch (e) {
              console.warn('Parse error:', e);
            }
          }
        }
      }

      options.onComplete?.(fullText);
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, options]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    clearHistory,
    deleteMessage,
    regenerate,
  };
}
