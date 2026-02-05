// 消息输入组件
import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Tooltip } from 'antd';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import { useChat } from '../../hooks/useChat';

const { TextArea } = Input;

interface MessageInputProps {
  disabled?: boolean;
}

// 扩展Window接口
interface WindowWithTypingTimeout extends Window {
  typingTimeout?: number;
}

declare const window: WindowWithTypingTimeout;

const MessageInput: React.FC<MessageInputProps> = ({ disabled = false }) => {
  const [inputValue, setInputValue] = useState('');
  const textAreaRef = useRef<any>(null);
  
  const {
    sendMessage,
    isSending,
    isStreaming,
    stopStreaming,
  } = useChat();
  
  // 自动调整文本域高度
  useEffect(() => {
    if (textAreaRef.current) {
      // 尝试获取实际的textarea元素
      const textareaElement = textAreaRef.current.input || textAreaRef.current.nativeElement || textAreaRef.current;
      if (textareaElement && textareaElement.style) {
        textareaElement.style.height = 'auto';
        if (textareaElement.scrollHeight) {
          textareaElement.style.height = `${Math.min(textareaElement.scrollHeight, 200)}px`;
        }
      }
    }
  }, [inputValue]);
  
  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };
  
  // 处理发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isSending || disabled) return;
    
    const content = inputValue.trim();
    setInputValue('');
    
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };
  
  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div 
      className="message-input"
      style={{
        position: 'sticky',
        bottom: 0,
        padding: '16px',
        backgroundColor: 'white',
        borderTop: '1px solid #f0f0f0',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
        {/* 文本输入框 */}
        <TextArea
          ref={textAreaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="输入消息... (Shift+Enter 换行)"
          style={{
            flex: 1,
            borderRadius: '8px',
            resize: 'none',
            minHeight: '64px',
            maxHeight: '200px',
          }}
          disabled={isSending || disabled}
          autoSize={{ minRows: 1, maxRows: 4 }}
        />
        
        {/* 操作按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* 停止按钮 */}
          {isStreaming && (
            <Tooltip title="停止生成">
              <Button
                danger
                icon={<StopOutlined />}
                onClick={stopStreaming}
                style={{ width: '48px', height: '48px', borderRadius: '8px' }}
              />
            </Tooltip>
          )}
          
          {/* 发送按钮 */}
          <Tooltip title="发送消息 (Enter)">
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending || disabled}
              loading={isSending}
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '8px',
                backgroundColor: inputValue.trim() ? '#1890ff' : '#d9d9d9',
              }}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;