/**
 * 演示组件 - 展示 useAIChat hook 的使用
 *
 * 这个文件包含了多个演示组件，可以直接复制到项目中使用
 */

import React, { useState } from 'react';
import { useAIChat, Message } from './useAIChat';

// ============================================
// 示例 1: 最基础的聊天组件
// ============================================

export function BasicChatDemo() {
  const { messages, isLoading, sendMessage } = useAIChat({
    apiEndpoint: '/api/v1/chat/completions',
    apiKey: 'your-api-key-here',
    model: 'Qwen/Qwen2.5-72B-Instruct',
  });

  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage(input);
    setInput('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>基础聊天示例</h2>

      {/* 消息列表 */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {messages.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>
            开始聊天吧！
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              }}
            >
              <strong style={{ color: msg.role === 'user' ? '#1976d2' : '#333' }}>
                {msg.role === 'user' ? '👤 你' : '🤖 AI'}
              </strong>
              <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>
                {msg.content || '...'}
              </p>
            </div>
          ))
        )}
        {isLoading && (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            AI 正在思考...
          </div>
        )}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: isLoading ? '#ccc' : '#1976d2',
            color: 'white',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? '发送中...' : '发送'}
        </button>
      </form>
    </div>
  );
}

// ============================================
// 示例 2: 带高级功能的聊天组件
// ============================================

export function AdvancedChatDemo() {
  const [systemPrompt, setSystemPrompt] = useState(
    '你是一个有帮助的 AI 助手。请用简洁、准确的语言回答问题。'
  );

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    clearHistory,
    regenerate,
  } = useAIChat({
    apiEndpoint: '/api/v1/chat/completions',
    apiKey: 'your-api-key-here',
    model: 'Qwen/Qwen2.5-72B-Instruct',
    systemPrompt,
    onChunk: (text) => {
      // 可以在这里做更多事情，比如统计 token 数
      console.log('Received chunk:', text.length, 'chars');
    },
    onComplete: (fullText) => {
      console.log('Generation complete:', fullText.length, 'chars');
    },
  });

  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>高级聊天示例</h2>

      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        <button onClick={() => setShowSettings(!showSettings)}>
          {showSettings ? '隐藏设置' : '显示设置'}
        </button>
        <button onClick={clearHistory} disabled={messages.length === 0}>
          清空历史
        </button>
        <button
          onClick={regenerate}
          disabled={isLoading || messages.filter(m => m.role === 'user').length === 0}
        >
          重新生成
        </button>
        {isLoading && (
          <button onClick={stopGeneration} style={{ backgroundColor: '#dc3545' }}>
            停止生成
          </button>
        )}
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <strong>系统提示词 (System Prompt)</strong>
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              resize: 'vertical',
            }}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            系统提示词用于设定 AI 的角色和行为规范
          </p>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #ef5350',
          borderRadius: '4px',
          padding: '12px',
          marginBottom: '16px',
          color: '#c62828',
        }}>
          <strong>错误:</strong> {error}
        </div>
      )}

      {/* 消息列表 */}
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        maxHeight: '500px',
        overflowY: 'auto',
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3>开始聊天</h3>
            <p>输入问题，获取 AI 的回答</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                marginBottom: '16px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              {/* 头像 */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: msg.role === 'user' ? '#1976d2' : '#4caf50',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>

              {/* 消息内容 */}
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? '#1976d2' : '#f0f0f0',
                color: msg.role === 'user' ? 'white' : '#333',
                marginLeft: msg.role === 'user' ? '12px' : '16px',
                marginRight: msg.role === 'user' ? '0' : '12px',
              }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content || <span style={{ opacity: 0.5 }}>Thinking...</span>}
                </p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#666',
            padding: '8px 0',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#666',
              animation: 'pulse 0.6s infinite alternate',
            }} />
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#666',
              animation: 'pulse 0.6s infinite alternate 0.2s',
            }} />
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#666',
              animation: 'pulse 0.6s infinite alternate 0.4s',
            }} />
            <span>AI 正在输入...</span>
          </div>
        )}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题... (Shift+Enter 换行)"
          disabled={isLoading}
          rows={2}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isLoading || !input.trim() ? '#ccc' : '#1976d2',
            color: 'white',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          发送
        </button>
      </form>

      <style>{`
        @keyframes pulse {
          from { opacity: 0.4; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// 示例 3: 带 Markdown 渲染的聊天组件
// ============================================

export function MarkdownChatDemo() {
  const { messages, isLoading, sendMessage } = useAIChat({
    apiEndpoint: '/api/v1/chat/completions',
    apiKey: 'your-api-key-here',
    model: 'Qwen/Qwen2.5-72B-Instruct',
  });

  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  // 简单的 Markdown 渲染（生产环境建议使用 react-markdown）
  const renderMarkdown = (text: string) => {
    // 代码块
    let rendered = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;"><code>${code.trim()}</code></pre>`;
    });

    // 行内代码
    rendered = rendered.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;">$1</code>');

    // 粗体
    rendered = rendered.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 换行
    rendered = rendered.replace(/\n/g, '<br/>');

    return rendered;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Markdown 渲染示例</h2>

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        maxHeight: '500px',
        overflowY: 'auto',
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '16px' }}>
            <strong style={{ color: msg.role === 'user' ? '#1976d2' : '#4caf50' }}>
              {msg.role === 'user' ? '👤 你' : '🤖 AI'}
            </strong>
            <div
              style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
          </div>
        ))}
        {isLoading && <p>AI 正在输入...</p>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="试试问：用 JavaScript 写一个快速排序算法"
          disabled={isLoading}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#1976d2',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          发送
        </button>
      </form>
    </div>
  );
}

// ============================================
// 使用指南
// ============================================

/**
 * 如何选择示例:
 *
 * 1. BasicChatDemo - 最小化示例，适合快速理解核心逻辑
 * 2. AdvancedChatDemo - 完整功能示例，适合直接用于生产
 * 3. MarkdownChatDemo - 展示如何集成 Markdown 渲染
 *
 * 使用步骤:
 * 1. 复制 useAIChat.ts 到你的项目
 * 2. 复制任意演示组件到你的项目
 * 3. 修改 API 端点和 API Key
 * 4. 根据需要调整样式
 *
 * 自定义提示:
 * - 修改 systemPrompt 可以改变 AI 的行为
 * - 添加 onChunk 回调可以实现打字机效果
 * - 添加 onComplete 回调可以做统计分析
 */
