// API Key输入组件
import React, { useState, useEffect } from 'react';
import { Input, Button, Tooltip, Typography, message } from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useConfig } from '../../hooks/useConfig';

const { Text } = Typography;

const APIKeyInput: React.FC = () => {
  const { apiKey, setAPIKey } = useConfig();
  const [inputValue, setInputValue] = useState(apiKey);
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 当apiKey变化时，更新输入框值
  useEffect(() => {
    setInputValue(apiKey);
  }, [apiKey]);
  
  // 处理保存API Key
  const handleSave = () => {
    if (!inputValue.trim()) {
      message.warning('API Key不能为空');
      return;
    }
    
    setIsSaving(true);
    try {
      setAPIKey(inputValue.trim());
      message.success('API Key保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 处理清除API Key
  const handleClear = () => {
    setInputValue('');
    setAPIKey('');
    message.info('API Key已清除');
  };
  
  return (
    <div style={{ marginBottom: '24px' }}>
      <Text strong style={{ display: 'block', marginBottom: '8px' }}>API Key</Text>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Input
          prefix={<LockOutlined />}
          suffix={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tooltip title={isVisible ? '隐藏' : '显示'}>
                <Button
                  type="text"
                  icon={isVisible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                  onClick={() => setIsVisible(!isVisible)}
                  size="small"
                />
              </Tooltip>
              <Button
                type="text"
                danger
                onClick={handleClear}
                size="small"
                disabled={!inputValue}
              >
                清除
              </Button>
            </div>
          }
          type={isVisible ? 'text' : 'password'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入您的SiliconFlow API Key"
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          onClick={handleSave}
          loading={isSaving}
          disabled={inputValue === apiKey}
        >
          保存
        </Button>
      </div>
      <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
        API Key将保存在本地存储中，不会上传到服务器
      </Text>
    </div>
  );
};

export default APIKeyInput;