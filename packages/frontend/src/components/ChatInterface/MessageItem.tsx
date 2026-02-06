// 消息组件
import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
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
    <div className={`message-item ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}>
      {/* 头像 */}
      <div className={`message-avatar ${message.role === 'user' ? 'user-avatar' : 'assistant-avatar'}`}>
        {message.role === 'user' ? 'U' : 'A'}
      </div>
      
      {/* 消息内容 */}
      <div className="message-content">
        {/* 消息头部 */}
        <div className="message-header">
          <span className={`message-author ${message.role === 'user' ? 'user-author' : 'assistant-author'}`}>
            {message.role === 'user' ? '你' : '助手'}
          </span>
          <span className="message-time">{formatTime(message.timestamp)}</span>
        </div>
        
        {/* 消息主体 */}
        <div className={`message-body ${message.role === 'user' ? 'user-message' : ''}`}>
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight]}
            components={{
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <pre>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
        {/* 消息统计和操作 */}
        <div className="message-footer">
          {/* 消息统计 */}
          <div className="message-stats">
            {message.time && (
              <span className="message-stat-item">响应时间: {message.time}ms</span>
            )}
            {message.tokens && (
              <span className="message-stat-item">Tokens: {message.tokens}</span>
            )}
          </div>
          
          {/* 复制按钮 */}
          <Tooltip title={copied ? '已复制!' : '复制内容'}>
            <Button 
              type="text" 
              size="small" 
              onClick={handleCopy}
              className="message-copy-btn"
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