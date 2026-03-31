// 主聊天区域组件
import React, { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useConfig } from '../../hooks/useConfig';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';

const ChatMain: React.FC = () => {
  const { getCurrentSession, error } = useChat();
  const { apiKey, modelConfig } = useConfig();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const currentSession = getCurrentSession();
  
  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 当消息列表变化时，滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);
  
  // 当会话切换时，滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.id]);
  
  // 渲染消息列表
  const renderMessages = () => {
    if (!currentSession) return null;
    
    if (currentSession.messages.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h3 className="empty-state-title">开始聊天吧！</h3>
          <p className="empty-state-description">输入您的问题，获取AI的回答</p>
        </div>
      );
    }
    
    return (
      <div className="messages-container">
        {currentSession.messages.map((message) => (
          <MessageItem key={message.id} message={message} modelName={message.role === 'assistant' ? modelConfig.model : undefined} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };
  
  // 渲染错误提示
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="error-notification">
        <div className="error-icon">⚠️</div>
        <div className="error-content">
          <h4 className="error-title">错误</h4>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  };
  
  // 渲染API Key未设置提示
  const renderAPIKeyPrompt = () => {
    if (apiKey) return null;
    
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔑</div>
        <h3 className="empty-state-title">请先设置API Key</h3>
        <p className="empty-state-description">在配置面板中输入您的阿里云百炼 API Key</p>
      </div>
    );
  };
  
  return (
    <div className="chat-main">
      {/* 聊天头部 */}
      <div className="chat-header">
        <h2 className="chat-header-title">
          {currentSession?.title || '新会话'}
        </h2>
      </div>
      
      {/* 错误提示 */}
      {renderError()}
      
      {/* 消息列表 */}
      <div 
        ref={chatContainerRef}
        className="chat-messages"
      >
        {apiKey ? renderMessages() : renderAPIKeyPrompt()}
      </div>
      
      {/* 消息输入框 */}
      <MessageInput disabled={!apiKey} />
    </div>
  );
};

export default ChatMain;