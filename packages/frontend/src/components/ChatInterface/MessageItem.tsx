// 消息组件
import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
  modelName?: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, modelName }) => {
  const [copied, setCopied] = useState(false);

  // 复制消息内容
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex mb-4 relative z-10 animate-fade-in`}>
      {/* 头像 */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mr-3 flex-shrink-0 ${message.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
        {message.role === 'user' ? 'U' : (modelName ? modelName.charAt(0).toUpperCase() : 'A')}
      </div>

      {/* 消息内容 */}
      <div className="flex-1 max-w-[70%]">
        {/* 消息头部 */}
        <div className="flex items-center mb-1">
          <span className={`text-sm font-semibold mr-2 ${message.role === 'user' ? 'text-primary' : 'text-secondary'}`}>
            {message.role === 'user' ? '你' : modelName || '助手'}
          </span>
          <span className="text-xs text-text-tertiary">{formatTime(message.timestamp)}</span>
        </div>

        {/* 消息主体 */}
        <div className={`bg-bg-secondary rounded-lg p-3 shadow-sm border ${message.role === 'user' ? 'border-primary shadow-[0_2px_4px_rgba(126,34,206,0.1)]' : 'border-border-default'}`}>
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight]}
            components={{
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <pre className="bg-bg-tertiary rounded-md p-3 overflow-x-auto my-2 border border-border-default">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className={`${className} bg-bg-tertiary rounded px-1 py-0.5`} {...props}>
                    {children}
                  </code>
                );
              },
              a: ({ children, href, ...props }) => (
                <a href={href} className="text-primary hover:text-primary-light hover:underline" {...props}>
                  {children}
                </a>
              ),
              blockquote: ({ children, ...props }) => (
                <blockquote className="border-l-4 border-primary pl-3 my-3 text-text-secondary italic" {...props}>
                  {children}
                </blockquote>
              ),
              h1: ({ children, ...props }) => (
                <h1 className="text-2xl font-semibold my-4 text-text-primary" {...props}>
                  {children}
                </h1>
              ),
              h2: ({ children, ...props }) => (
                <h2 className="text-xl font-semibold my-3 text-text-primary" {...props}>
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 className="text-lg font-semibold my-2 text-text-primary" {...props}>
                  {children}
                </h3>
              ),
              ul: ({ children, ...props }) => (
                <ul className="my-2 pl-6 list-disc" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="my-2 pl-6 list-decimal" {...props}>
                  {children}
                </ol>
              ),
              li: ({ children, ...props }) => (
                <li className="mb-1" {...props}>
                  {children}
                </li>
              ),
              p: ({ children, ...props }) => (
                <p className="mb-3 leading-relaxed" {...props}>
                  {children}
                </p>
              ),
              img: ({ src, alt, ...props }) => (
                <img src={src} alt={alt} className="max-w-full rounded-md my-2" {...props} />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* 消息统计和操作 */}
        <div className="flex justify-between items-center mt-2">
          {/* 消息统计 */}
          <div className="flex items-center gap-3 text-xs text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
            {message.time && (
              <span>响应时间: {message.time}ms</span>
            )}
            {message.tokens && (
              <span>Tokens: {message.tokens}</span>
            )}
          </div>

          {/* 复制按钮 */}
          <Tooltip title={copied ? '已复制!' : '复制内容'}>
            <Button
              type="text"
              size="small"
              onClick={handleCopy}
              className="text-xs"
            >
              {copied ? '已复制' : '复制'}
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;