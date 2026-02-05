// 消息组件
import React, { useState } from 'react';
import { Card, Button, Tooltip, Typography } from 'antd';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import type { Message } from '../../types';

const { Text } = Typography;

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
  
  // 渲染消息统计信息
  const renderStats = () => {
    if (!message.time) return null;
    
    return (
      <div className="message-stats">
        <Text type="secondary" style={{ fontSize: '12px' }}>
          响应时间: {message.time}ms
        </Text>
        {message.tokens && (
          <Text type="secondary" style={{ fontSize: '12px', marginLeft: '16px' }}>
            Tokens: {message.tokens}
          </Text>
        )}
      </div>
    );
  };
  
  return (
    <div 
      className={`message-item ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
      style={{
        display: 'flex',
        marginBottom: '16px',
        alignItems: 'flex-start',
      }}
    >
      {/* 头像 */}
      <div 
        className="message-avatar"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          marginRight: '12px',
        }}
      >
        {message.role === 'user' ? 'U' : 'A'}
      </div>
      
      {/* 消息内容 */}
      <div style={{ flex: 1, maxWidth: '80%' }}>
        {/* 消息头部 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <Text 
            strong 
            style={{
              fontSize: '14px',
              color: message.role === 'user' ? '#1890ff' : '#52c41a',
            }}
          >
            {message.role === 'user' ? '你' : '助手'}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {formatTime(message.timestamp)}
          </Text>
        </div>
        
        {/* 消息主体 */}
        <Card 
          size="small" 
          style={{
            marginBottom: '8px',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
          }}
          bodyStyle={{
            padding: '12px',
            lineHeight: '1.6',
          }}
        >
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight]}
            components={{
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <pre style={{ margin: 0 }}>
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
        </Card>
        
        {/* 消息统计和操作 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {renderStats()}
          <Tooltip title={copied ? '已复制!' : '复制内容'}>
            <Button 
              type="text" 
              size="small" 
              onClick={handleCopy}
              style={{ fontSize: '12px' }}
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