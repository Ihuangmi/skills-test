# AI 应用前端架构与实践 - 演讲大纲

## 基本信息
- **时长**: 40-45 分钟（含 10 分钟 Q&A）
- **受众**: 前端工程师（有 AI 编程经验）
- **形式**: 技术分享 + 代码演示

---

## 开场 (3 分钟)

### Slide 1: 标题页
```
AI 应用前端架构与实践
—— 从 0 到 1 构建流式聊天应用

分享人：[你的名字]
日期：2026-03-31
```

### Slide 2: 为什么聊这个主题？
**演讲要点**:
- AI 应用已成为前端开发的常见场景
- 流式响应带来的技术挑战与传统 Web 应用不同
- 今天分享的内容都来自实际项目经验

**互动问题**:
> "在座的各位有谁在自己的项目里集成过 AI API？举手看一下"

---

## 第一部分：项目概览 (5 分钟)

### Slide 3: 示例项目介绍
```
SiliconFlow Chat
- React 19 + TypeScript
- Zustand 状态管理
- SSE 流式响应
- Monorepo 架构
```

**演讲要点**:
- 这是一个类 OpenAI 的聊天应用
- 对接 SiliconFlow 平台（兼容 OpenAI API 格式）
- 代码开源在本地项目中，稍后可以随时查看

### Slide 4: 技术栈选型
| 层级 | 技术 | 选型理由 |
|------|------|---------|
| 框架 | React 19 | 团队熟悉，生态完善 |
| 状态 | Zustand | 轻量，API 简洁 |
| HTTP | Axios + Fetch | Axios 用于普通请求，Fetch 用于流式 |

**演讲要点**:
- 为什么不用 Redux？—— AI 应用状态相对简单，Zustand 足够
- 为什么不用 SWR/React Query？—— 流式场景不适合缓存

---

## 第二部分：核心架构 (12 分钟)

### Slide 5: 分层架构
```
┌─────────────────────────────────────┐
│  UI Components (ChatMain, etc.)    │
├─────────────────────────────────────┤
│  State Layer (Zustand Store)       │
├─────────────────────────────────────┤
│  API Layer (api.ts)                │
├─────────────────────────────────────┤
│  Transport (Fetch + ReadableStream)│
└─────────────────────────────────────┘
```

**演讲要点**:
- 清晰的分层便于维护和测试
- 状态管理与 UI 分离
- API 层封装细节，对 UI 透明

### Slide 6: Zustand 状态设计
```typescript
interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string;
  isSending: boolean;
  isStreaming: boolean;
  error: string | null;

  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  createSession: () => ChatSession;
  deleteSession: (sessionId: string) => void;
}
```

**演讲要点**:
- `isSending` 和 `isStreaming` 为什么要分开？
  - 发送中：等待响应开始
  - 流式中：正在接收数据
- 这样设计可以精确控制 UI 状态

### Slide 7: 流式处理核心代码
```typescript
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // 保留不完整行

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      onChunk(data.choices[0].delta.content);
    }
  }
}
```

**演讲要点**:
- ⚠️ 关键点：必须保留不完整行（buffer 处理）
- ⚠️ SSE 格式：每行以 `data: ` 开头，`[DONE]` 结束
- 使用 `stream: true` 保证 UTF-8 多字节字符不被截断

### Slide 8: 实时演示代码
**操作**:
1. 打开 `examples/useAIChat.ts`
2. 逐段讲解核心逻辑
3. 强调错误处理和中止机制

**代码重点**:
```typescript
// 中止机制
const controller = new AbortController();
return () => controller.abort();

// 错误恢复
setMessages(prev => prev.slice(0, -1)); // 移除失败消息
```

---

## 第三部分：性能优化 (8 分钟)

### Slide 9: 优化策略概览
```
1. 批量更新节流
2. 平滑滚动优化
3. 避免不必要的重渲染
```

### Slide 10: 节流更新
```typescript
// 问题：每个 chunk 都触发 React 渲染，可能导致卡顿
// 解决：节流到每 50ms 更新一次

const useThrottledChunkHandler = (onChunk, ms = 50) => {
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

### Slide 11: 滚动优化
```typescript
// ❌ 错误：每次消息变化都触发
useEffect(() => {
  scrollToBottom();
}, [currentSession?.messages]);

// ✅ 正确：只监听消息数量
useEffect(() => {
  scrollToBottom();
}, [currentSession?.messages.length]);
```

**演讲要点**:
- 监听整个数组会导致内容更新时也触发滚动
- 只监听长度可以避免滚动闪烁

---

## 第四部分：最佳实践与陷阱 (7 分钟)

### Slide 12: 常见陷阱 Top 3

**陷阱 1: 忘记清理中止处理器**
```typescript
// ❌ 可能导致内存泄漏
useEffect(() => {
  const abortFn = sendStreamChatRequest();
  return () => abortFn(); // abortFn 可能还是 null
}, []);

// ✅ 使用 ref 保存
const abortRef = useRef<(() => void) | null>(null);
useEffect(() => {
  abortRef.current = sendStreamChatRequest();
  return () => abortRef.current?.();
}, []);
```

**陷阱 2: 直接修改状态数组**
```typescript
// ❌ React 无法检测变化
messages.push(newMessage);
setMessages(messages);

// ✅ 创建新引用
setMessages(prev => [...prev, newMessage]);
```

**陷阱 3: API Key 硬编码**
```typescript
// ❌ 绝对不要这样做
const apiKey = 'sk-xxxxx';

// ✅ 从配置/环境变量读取
const apiKey = import.meta.env.VITE_API_KEY;
```

### Slide 13: 安全建议

1. **生产环境使用后端中转**
   - 前端 → 你的后端 → AI API
   - 避免 Key 泄露

2. **实现速率限制**
   - 防止滥用

3. **输入验证**
   - 防止 Prompt 注入攻击

---

## 第五部分：扩展讨论 (5 分钟)

### Slide 14: 进阶主题

**Function Calling**
- 让 AI 调用前端函数
- 示例：查询天气、执行计算

**多模态处理**
- 图片上传与分析
- 文件内容总结

**RAG 架构**
- 检索增强生成
- 结合企业知识库

**本地模型**
- WebLLM + WebGPU
- 隐私友好的选择

### Slide 15: 推荐资源

- [ReadableStream MDN](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [Zustand 官方文档](https://github.com/pmndrs/zustand)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference/chat)

---

## Q&A (10 分钟)

### Slide 16: 问题时间

**预准备的问题（冷场时用）**:
1. "如何处理长对话的上下文限制？"
   - 答：滑动窗口、摘要压缩、向量检索

2. "流式响应如何做国际化？"
   - 答：在 system prompt 中指定语言

3. "如何评估 AI 回答的质量？"
   - 答：用户反馈、自动评估（一致性、相关性）

---

## 结束语

### Slide 17: Takeaways

1. **架构分层** 是维护性的关键
2. **流式处理** 需要注意缓冲和中止
3. **性能优化** 要关注渲染频率
4. **安全** 永远是第一位的

### Slide 18: 联系方式

```
项目代码位置：D:\code\test\skills-test
分享文档：docs/ai-frontend-sharing.md
示例代码：examples/

Q&A 结束后可以自由交流！
```

---

## 附录：演示准备清单

### 演示前检查
- [ ] 确认示例代码可以运行
- [ ] 准备一个有效的 API Key
- [ ] 测试网络连通性
- [ ] 准备备用录屏（防止现场出问题）

### 文件位置
| 文件 | 用途 |
|------|------|
| `docs/ai-frontend-sharing.md` | 完整文档 |
| `examples/useAIChat.ts` | 核心 Hook |
| `examples/ChatDemo.tsx` | 演示组件 |
