# AI 应用前端架构与实践

> 面向前端团队的 AI 编程分享材料
> 2026-03-31

---

## 目录

1. [AI 应用前端架构模式](#1-ai-应用前端架构模式)
2. [流式响应的实现与优化](#2-流式响应的实现与优化)
3. [实战代码示例](#3-实战代码示例)
4. [最佳实践与陷阱](#4-最佳实践与陷阱)

---

## 1. AI 应用前端架构模式

### 1.1 核心挑战

AI 应用相比传统 Web 应用的特殊之处：

| 传统 Web 应用 | AI 应用 |
|--------------|---------|
| 请求-响应模式 | 流式响应 (SSE) |
| 确定性结果 | 概率性/生成式结果 |
| 完整数据返回 | 增量数据更新 |
| 简单取消逻辑 | 复杂的中断/继续逻辑 |

### 1.2 状态管理架构

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                             │
│  (ChatMain, MessageList, MessageInput, ConfigPanel)    │
├─────────────────────────────────────────────────────────┤
│                   State Layer                           │
│         (Zustand Store - useChat, useConfig)           │
├─────────────────────────────────────────────────────────┤
│                 Business Logic Layer                    │
│    (sendMessage, streaming handling, session mgmt)      │
├─────────────────────────────────────────────────────────┤
│                   API Layer                             │
│         (api.ts - sendStreamChatRequest)                │
├─────────────────────────────────────────────────────────┤
│                Transport Layer                          │
│         (Fetch API + ReadableStream)                    │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Zustand 状态设计

**核心状态结构：**

```typescript
interface ChatState {
  // 会话数据
  sessions: ChatSession[];
  currentSessionId: string;

  // 消息状态
  isSending: boolean;      // 是否正在发送
  isStreaming: boolean;    // 是否正在接收流式响应
  error: string | null;

  // 操作
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  createSession: () => ChatSession;
  deleteSession: (sessionId: string) => void;
}
```

**为什么选择 Zustand？**

```typescript
// ✅ 简洁的 API
const { sendMessage, stopStreaming } = useChat();

// ✅ 外部访问 (非组件场景)
useConfig.getState().apiKey;

// ✅ 自动持久化中间件
export const useChat = create<ChatState>(
  persist(/* ... */)
);
```

---

## 2. 流式响应的实现与优化

### 2.1 SSE 协议基础

```
data: {"choices":[{"delta":{"content":"你"}}]}

data: {"choices":[{"delta":{"content":"好"}}]}

data: {"choices":[{"delta":{"content":"，"}}]}

data: [DONE]
```

### 2.2 核心实现代码

```typescript
// packages/frontend/src/utils/api.ts

export const sendStreamChatRequest = (
  apiKey: string,
  messages: Message[],
  modelConfig: ModelConfig,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
): (() => void) => {
  const controller = new AbortController();

  const fetchStream = async () => {
    const response = await fetch('/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
        stream: true,
      }),
      signal: controller.signal,
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onComplete();
        break;
      }

      // 解码并缓冲数据
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留不完整的一行

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') {
            onComplete();
            return;
          }

          const data = JSON.parse(dataStr);
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        }
      }
    }
  };

  fetchStream();

  // 返回取消函数
  return () => controller.abort();
};
```

### 2.3 流式状态管理

```typescript
// packages/frontend/src/hooks/useChat.ts

export const useChat = create<ChatState>((set, get) => {
  let abortStreaming: (() => void) | null = null;

  return {
    sendMessage: async (content) => {
      // 1. 创建用户消息和空的助手消息
      const userMessage: Message = { id: genId(), role: 'user', content };
      const assistantMessage: Message = { id: genId(), role: 'assistant', content: '' };

      // 2. 立即更新 UI（乐观更新）
      const updatedSession = {
        ...currentSession,
        messages: [...currentSession.messages, userMessage, assistantMessage],
      };
      set({ sessions: [updatedSession], isStreaming: true });

      // 3. 发送流式请求
      abortStreaming = sendStreamChatRequest(
        apiKey,
        updatedSession.messages,
        modelConfig,
        // 流式回调：逐字更新
        (chunk) => {
          const session = get().getCurrentSession();
          const lastMessage = session!.messages[session!.messages.length - 1];
          const updatedMessages = [...session!.messages];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + chunk,
          };
          set({
            sessions: [{ ...session!, messages: updatedMessages }]
          });
        },
        // 完成回调
        () => {
          set({ isStreaming: false, isSending: false });
          // 自动生标题
          if (session.messages.length === 2) {
            generateTitleFromFirstMessage();
          }
        },
        // 错误回调
        (error) => {
          set({ error: error.message, isStreaming: false });
          // 移除空的助手消息
          removeEmptyAssistantMessage();
        }
      );
    },

    stopStreaming: () => {
      if (abortStreaming) {
        abortStreaming();
        set({ isStreaming: false, isSending: false });
      }
    },
  };
});
```

### 2.4 性能优化技巧

**1. 批量更新节流**

```typescript
// 避免每次 chunk 都触发 React 渲染
const useThrottledChunkHandler = (onChunk: (text: string) => void, ms = 50) => {
  const buffer = useRef('');
  const lastUpdate = useRef(0);

  return useCallback((chunk: string) => {
    buffer.current += chunk;
    const now = Date.now();

    if (now - lastUpdate.current > ms) {
      onChunk(buffer.current);
      buffer.current = '';
      lastUpdate.current = now;
    }
  }, [onChunk, ms]);
};
```

**2. 平滑滚动优化**

```typescript
// packages/frontend/src/components/ChatInterface/ChatMain.tsx

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'end'
  });
};

// 只在消息内容变化时触发，避免滚动闪烁
useEffect(() => {
  scrollToBottom();
}, [currentSession?.messages.length]); // 仅监听消息数量
```

---

## 3. 实战代码示例

### 3.1 完整的最小可运行示例

```tsx
// 一个 100 行以内的 AI 聊天组件
import React, { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function SimpleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 创建空的助手消息用于流式更新
    const assistantMessageId = Date.now();
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, userMessage],
        stream: true,
      }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content || '';

          setMessages(prev => prev.map((msg, i) =>
            i === prev.length - 1
              ? { ...msg, content: msg.content + content }
              : msg
          ));
        }
      }
    }

    setIsLoading(false);
  };

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role}: </strong>
            {msg.content || 'Thinking...'}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
        placeholder="输入问题..."
        disabled={isLoading}
      />
      <button onClick={sendMessage} disabled={isLoading}>
        {isLoading ? '发送中...' : '发送'}
      </button>
    </div>
  );
}
```

### 3.2 带错误恢复的进阶示例

```typescript
// 带重试逻辑的流式请求
export const sendWithRetry = async (
  params: StreamParams,
  maxRetries = 2,
): Promise<void> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await sendStreamChatRequest(
        params.apiKey,
        params.messages,
        params.onChunk,
        params.onComplete,
        params.onError,
      );
      return; // 成功则返回
    } catch (error) {
      lastError = error as Error;

      // 判断是否可重试
      const isRetryable =
        error instanceof NetworkError ||
        error instanceof TimeoutError;

      if (!isRetryable || attempt === maxRetries) {
        params.onError(error as Error);
        return;
      }

      // 指数退避
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
    }
  }
};
```

### 3.3 自定义 Hook 封装

```typescript
// hooks/useAIChat.ts - 可复用的聊天 Hook

import { useState, useCallback, useRef } from 'react';

interface UseAIChatOptions {
  apiEndpoint: string;
  apiKey?: string;
  model?: string;
  onChunk?: (text: string) => void;
  onComplete?: (fullText: string) => void;
}

export function useAIChat(options: UseAIChatOptions) {
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setError(null);
    setIsLoading(true);

    const userMessage = { role: 'user' as const, content };
    setMessages(prev => [...prev, userMessage]);

    // 预占位助手消息
    setMessages(prev => [...prev, { role: 'assistant' as const, content: '' }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.apiKey && { 'Authorization': `Bearer ${options.apiKey}` }),
        },
        body: JSON.stringify({
          model: options.model || 'gpt-3.5-turbo',
          messages: [...messages, userMessage],
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content || '';

              fullText += delta;
              options.onChunk?.(delta);

              setMessages(prev => prev.map((msg, i) =>
                i === prev.length - 1
                  ? { ...msg, content: msg.content + delta }
                  : msg
              ));
            } catch (e) {
              console.warn('JSON parse error:', e);
            }
          }
        }
      }

      options.onComplete?.(fullText);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        // 移除失败的助手消息
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, options]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    clearHistory,
  };
}
```

**使用示例：**

```tsx
function ChatComponent() {
  const { messages, isLoading, error, sendMessage, stopGeneration } = useAIChat({
    apiEndpoint: '/api/chat',
    apiKey: 'your-api-key',
    model: 'Qwen/Qwen2.5-72B-Instruct',
    onChunk: (text) => console.log('Chunk:', text),
    onComplete: (text) => console.log('Complete:', text),
  });

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          {msg.content}
        </div>
      ))}
      {isLoading && (
        <button onClick={stopGeneration}>停止生成</button>
      )}
    </div>
  );
}
```

---

## 4. 最佳实践与陷阱

### 4.1 ✅ 最佳实践

| 场景 | 推荐做法 |
|------|---------|
| 状态管理 | 使用 Zustand 等轻量级方案，避免过度工程化 |
| 流式处理 | 始终保留缓冲区处理不完整的数据行 |
| 错误处理 | 区分可重试错误和永久错误 |
| 取消操作 | 使用 AbortController，清理回调引用 |
| 数据持久化 | 会话数据存 localStorage，敏感信息不上传 |

### 4.2 ⚠️ 常见陷阱

**陷阱 1：忘记清理中止处理器**

```typescript
// ❌ 错误示例
useEffect(() => {
  const abortFn = sendStreamChatRequest(/* ... */);
  return () => abortFn(); // 可能 abortFn 还是 null
}, []);

// ✅ 正确示例
const abortRef = useRef<(() => void) | null>(null);
useEffect(() => {
  abortRef.current = sendStreamChatRequest(/* ... */);
  return () => abortRef.current?.();
}, []);
```

**陷阱 2：流式更新导致频繁重渲染**

```typescript
// ❌ 每个 chunk 都触发完整重渲染
setMessages(prev => [...prev, { content: prev[prev.length-1].content + chunk }]);

// ✅ 使用 refs 缓冲，节流更新
const bufferRef = useRef('');
const throttledUpdate = useMemo(() => throttle((text) => {
  setMessages(prev => updateLastMessage(prev, text));
}, 50), []);
```

**陷阱 3：消息顺序错乱**

```typescript
// ❌ 直接修改原数组
messages.push(newMessage);
setMessages(messages);

// ✅ 始终创建新引用
setMessages(prev => [...prev, newMessage]);
```

**陷阱 4：API Key 泄露**

```typescript
// ❌ 硬编码或在 URL 中传递
const url = `/api?key=${apiKey}`;

// ✅ 使用 Authorization 头
headers: { 'Authorization': `Bearer ${apiKey}` }

// ✅ 服务端中转（生产环境）
// 前端只请求本地后端，由后端转发到 AI API
```

### 4.3 安全建议

1. **永远不要在前端代码中硬编码 API Key**
2. **生产环境使用后端中转**，前端只访问自己的 API
3. **实现速率限制**，防止滥用
4. **输入验证**，防止 Prompt 注入

---

## 5. 扩展阅读

### 5.1 相关资源

- [ReadableStream MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [SSE 协议规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Zustand 官方文档](https://github.com/pmndrs/zustand)
- [OpenAI Chat Completion API](https://platform.openai.com/docs/api-reference/chat)

### 5.2 进阶主题

1. **Function Calling** - 让 AI 调用前端函数
2. **多模态处理** - 图片/文件上传与分析
3. **RAG 架构** - 检索增强生成
4. **本地模型集成** - WebLLM + WebGPU

---

## 6. 互动讨论

### 讨论话题

1. 你们在项目中遇到过哪些 AI 集成的挑战？
2. 对于流式响应，有哪些独特的 UX 优化想法？
3. 如何平衡 AI 生成内容的准确性和用户体验？

### 实战练习

选择一个主题实现 Demo：
- [ ] 带消息编辑功能的聊天界面
- [ ] 多会话管理（新建/切换/删除）
- [ ] Markdown 渲染 + 代码高亮
- [ ] 对话历史持久化

---

**Q&A**

如有问题，欢迎交流！
