// 消息输入组件
import React, { useState, useRef, useEffect } from 'react';
import { Input, Tooltip } from 'antd';
import { SendOutlined, CloseCircleFilled } from '@ant-design/icons';
import { useChat } from '../../hooks/useChat';

const { TextArea } = Input;

interface MessageInputProps {
  disabled?: boolean;
}

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
    <div className="bg-bg-primary border-t border-border-default p-4 sticky bottom-0 z-10">
      <div className="flex items-end gap-3">
        {/* 文本输入框 */}
        <div className="flex-1 relative">
          <TextArea
            ref={textAreaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="输入消息... (Shift+Enter 换行)"
            className="w-full border border-border-default rounded-lg p-3 resize-none font-inherit text-sm transition-all duration-normal bg-bg-secondary text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-bg-primary"
            disabled={isSending || disabled}
            autoSize={{ minRows: 1, maxRows: 4 }}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-2">
          {/* 停止按钮 - 流式响应时显示，替换发送按钮 */}
          {isStreaming ? (
            <Tooltip title="停止生成">
              <button
                onClick={stopStreaming}
                className="w-auto h-10 px-4 flex items-center justify-center gap-2 rounded-full bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 border border-gray-300 shadow-sm hover:shadow"
              >
                <CloseCircleFilled className="text-base" />
                <span className="text-sm font-medium">停止</span>
              </button>
            </Tooltip>
          ) : (
            /* 发送按钮 - 非流式响应时显示 */
            <Tooltip title="发送消息 (Enter)">
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending || disabled}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
              >
                <SendOutlined className="text-base" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;