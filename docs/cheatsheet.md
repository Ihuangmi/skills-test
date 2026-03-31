# AI 前端开发速查表

## 一、SSE 流式响应处理

### 标准流程
```typescript
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({ stream: true }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop()!; // 保留不完整行

  for (const line of lines) {
    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
      const data = JSON.parse(line.slice(6));
      // 处理数据...
    }
  }
}
```

### SSE 数据格式
```
data: {"choices":[{"delta":{"content":"你"}}]}

data: {"choices":[{"delta":{"content":"好"}}]}

data: [DONE]
```

---

## 二、Zustand 状态管理

### 创建 Store
```typescript
import { create } from 'zustand';

interface State {
  count: number;
  increment: () => void;
}

export const useStore = create<State>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### 组件中使用
```typescript
const { count, increment } = useStore();
```

### 外部访问
```typescript
// 非组件场景
const state = useStore.getState();
```

### 持久化
```typescript
import { persist } from 'zustand/middleware';

export const useStore = create<State>(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'my-store' }
  )
);
```

---

## 三、AbortController 中止请求

### 基本用法
```typescript
const controller = new AbortController();

fetch(url, { signal: controller.signal });

// 中止
controller.abort();
```

### React 中清理
```typescript
const abortRef = useRef<AbortController | null>(null);

useEffect(() => {
  abortRef.current = new AbortController();
  fetchData({ signal: abortRef.current.signal });

  return () => abortRef.current?.abort();
}, []);
```

---

## 四、常见错误处理

### 网络错误
```typescript
try {
  await fetch(url);
} catch (error) {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      // 用户中止，忽略
    } else if (error.name === 'TypeError') {
      // 网络错误
    }
  }
}
```

### HTTP 错误
```typescript
const response = await fetch(url);
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message || `HTTP ${response.status}`);
}
```

### 解析错误
```typescript
try {
  const data = JSON.parse(jsonString);
} catch (e) {
  console.error('JSON parse failed:', e);
}
```

---

## 五、React 性能优化

### 避免不必要的重渲染
```typescript
// ✅ 使用 useMemo
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// ✅ 使用 useCallback
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### 列表渲染加 key
```typescript
// ✅ 正确
messages.map(msg => <Message key={msg.id} {...msg} />)

// ❌ 错误（导致重渲染）
messages.map((msg, i) => <Message key={i} {...msg} />)
```

---

## 六、TypeScript 类型定义

### 消息类型
```typescript
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  id?: string;
  timestamp?: number;
}
```

### 会话类型
```typescript
interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
```

### API 响应类型
```typescript
interface ChatCompletion {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

---

## 七、调试技巧

### 日志输出
```typescript
// 流式请求日志
console.log('Sending request:', { url, method, body });
console.log('Response status:', response.status);
console.log('Received chunk:', chunk);
console.log('Parsing data:', dataStr);
```

### React DevTools
- Components: 检查组件 props 和 state
- Profiler: 分析重渲染性能

### 网络面板
- 查看 SSE 请求的实时数据
- 检查响应头 `Content-Type: text/event-stream`

---

## 八、环境变量配置

### Vite 项目
```bash
# .env.local
VITE_API_KEY=sk-xxxxx
VITE_API_BASE_URL=https://api.example.com
```

```typescript
// 使用
const apiKey = import.meta.env.VITE_API_KEY;
const baseUrl = import.meta.env.VITE_API_BASE_URL;
```

### 注意事项
- `.env.local` 已自动 gitignore
- 不要提交真实 API Key
- 使用 `.env.example` 提供模板

---

## 九、常用命令参考

### 项目开发
```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm lint         # 代码检查
pnpm preview      # 预览生产构建
```

### 依赖管理
```bash
pnpm add <pkg>    # 安装依赖
pnpm remove <pkg> # 删除依赖
pnpm up           # 更新依赖
```

---

## 十、快速排错指南

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| 流式响应乱码 | UTF-8 多字节被截断 | decoder 使用 `{ stream: true }` |
| 消息重复 | 数组更新方式错误 | 始终创建新引用 `setMessages(prev => [...])` |
| 滚动闪烁 | 每次内容更新都滚动 | 只监听消息数量变化 |
| 请求无法中止 | 未传递 signal | 确保 fetch 选项包含 `signal` |
| JSON 解析失败 | 空行或格式错误 | 先 `trim()` 再检查 `startsWith('data: ')` |
| API 401 错误 | Key 无效或过期 | 检查 API Key 格式和权限 |

---

## 附录：完整代码模板

### useAIChat Hook 模板
```typescript
import { useState, useCallback, useRef } from 'react';

interface Message { role: 'user' | 'assistant'; content: string; }

export function useAIChat(endpoint: string, apiKey?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setError(null);
    setIsLoading(true);

    const userMsg: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;

        for (const line of lines) {
          if (line.trim().startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            const data = JSON.parse(line.trim().slice(6));
            const delta = data.choices?.[0]?.delta?.content || '';

            setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].content += delta;
              return newMsgs;
            });
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError(e.message);
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, endpoint, apiKey]);

  return { messages, isLoading, error, sendMessage };
}
```

---

**速查表版本**: 1.0
**最后更新**: 2026-03-31
