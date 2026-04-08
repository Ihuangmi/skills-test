// 主聊天区域组件
import React, { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useConfig } from '../../hooks/useConfig';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';

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
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center text-2xl text-text-tertiary mb-4">💬</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">开始聊天吧！</h3>
          <p className="text-sm text-text-secondary max-w-[300px]">输入您的问题，获取AI的回答</p>
        </div>
      );
    }

    return (
      <div className="flex-1 p-6 bg-gradient-to-b from-bg-primary to-bg-secondary relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(126,34,206,0.02)_0%,transparent_20%),radial-gradient(circle_at_90%_80%,rgba(16,185,129,0.02)_0%,transparent_20%)] pointer-events-none z-0"></div>
        <div className="relative z-10">
          {currentSession.messages.map((message) => (
            <MessageItem key={message.id} message={message} modelName={message.role === 'assistant' ? modelConfig.model : undefined} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  };

  // 渲染错误提示
  const renderError = () => {
    if (!error) return null;

    return (
      <div className="bg-error/5 border border-error rounded-lg p-3 m-4 flex items-start gap-3">
        <div className="text-error flex-shrink-0 mt-1">⚠️</div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-error mb-1">错误</h4>
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-primary relative overflow-hidden h-full min-h-0">
      {/* 聊天头部 */}
      <div className="p-4 border-b border-border-default sticky top-0 bg-bg-primary z-10 flex justify-between items-center shadow-sm">
        <h2 className="text-lg font-semibold text-text-primary">
          {currentSession?.title || '新会话'}
        </h2>
        <ModelSelector />
      </div>

      {/* 错误提示 */}
      {renderError()}

      {/* 消息列表 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-text-tertiary scrollbar-track-bg-tertiary"
      >
        {renderMessages()}
      </div>

      {/* 消息输入框 */}
      <MessageInput disabled={!apiKey} />
    </div>
  );
};

export default ChatMain;