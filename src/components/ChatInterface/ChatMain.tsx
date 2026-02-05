// 主聊天区域组件
import React, { useEffect, useRef } from 'react';
import { Empty, Alert, Typography } from 'antd';
import { useChat } from '../../hooks/useChat';
import { useConfig } from '../../hooks/useConfig';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';

const { Title } = Typography;

const ChatMain: React.FC = () => {
  const { getCurrentSession, error, clearError } = useChat();
  const { apiKey } = useConfig();
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Empty 
            description="开始聊天吧！"
            style={{ textAlign: 'center' }}
          />
        </div>
      );
    }
    
    return (
      <div style={{ padding: '16px' }}>
        {currentSession.messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };
  
  // 渲染错误提示
  const renderError = () => {
    if (!error) return null;
    
    return (
      <Alert
        message="错误"
        description={error}
        type="error"
        showIcon
        closable
        onClose={clearError}
        style={{ margin: '16px' }}
      />
    );
  };
  
  // 渲染API Key未设置提示
  const renderAPIKeyPrompt = () => {
    if (apiKey) return null;
    
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '16px' }}>
        <Empty
          description={
            <div style={{ textAlign: 'center' }}>
              <Title level={5}>请先设置API Key</Title>
              <p>在左侧配置面板中输入您的SiliconFlow API Key</p>
            </div>
          }
          style={{ textAlign: 'center' }}
        />
      </div>
    );
  };
  
  return (
    <div 
      className="chat-main"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#fafafa',
      }}
    >
      {/* 错误提示 */}
      {renderError()}
      
      {/* 消息列表 */}
      <div 
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {apiKey ? renderMessages() : renderAPIKeyPrompt()}
      </div>
      
      {/* 消息输入框 */}
      <MessageInput disabled={!apiKey} />
    </div>
  );
};

export default ChatMain;