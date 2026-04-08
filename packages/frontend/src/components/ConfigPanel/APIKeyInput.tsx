import React, { useState, useEffect } from 'react';
import { Input, Button, Tooltip, message } from 'antd';
import {
  LockOutlined,
  LinkOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  SaveOutlined
} from '@ant-design/icons';
import { useConfig } from '../../hooks/useConfig';

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

const isValidBaseUrl = (value: string) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.hash;
  } catch {
    return false;
  }
};

const APIKeyInput: React.FC = () => {
  const { apiKey, baseUrl, saveConnectionConfig } = useConfig();
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);
  const [baseUrlInput, setBaseUrlInput] = useState(baseUrl);
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setApiKeyInput(apiKey);
  }, [apiKey]);

  useEffect(() => {
    setBaseUrlInput(baseUrl);
  }, [baseUrl]);
  
  const handleSave = async () => {
    const normalizedApiKey = apiKeyInput.trim();
    const normalizedBaseUrl = normalizeBaseUrl(baseUrlInput);

    if (!normalizedApiKey) {
      message.warning('API Key 不能为空');
      return;
    }

    if (normalizedBaseUrl && !isValidBaseUrl(normalizedBaseUrl)) {
      message.warning('Base URL 格式不正确，请输入完整的 http/https 地址');
      return;
    }
    
    setIsSaving(true);
    try {
      await saveConnectionConfig(normalizedApiKey, normalizedBaseUrl);
      message.success('连接配置保存成功');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const isUnchanged =
    apiKeyInput.trim() === apiKey && normalizeBaseUrl(baseUrlInput) === baseUrl;
  
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">API Key</label>
        <Input
          prefix={<LockOutlined className="text-text-tertiary" />}
          suffix={
            <Tooltip title={isVisible ? '隐藏' : '显示'}>
              <Button
                type="text"
                icon={isVisible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                onClick={() => setIsVisible(!isVisible)}
                size="small"
                className="text-text-tertiary hover:text-primary transition-colors"
              />
            </Tooltip>
          }
          type={isVisible ? 'text' : 'password'}
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder="sk-..."
          size="large"
          className="rounded-lg hover:border-primary focus:border-primary shadow-sm"
          allowClear
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Base URL</label>
        <Input
          prefix={<LinkOutlined className="text-text-tertiary" />}
          value={baseUrlInput}
          onChange={(e) => setBaseUrlInput(e.target.value)}
          placeholder="https://api.openai.com/v1"
          size="large"
          className="rounded-lg hover:border-primary focus:border-primary shadow-sm"
          allowClear
        />
        <div className="mt-2 p-3 bg-bg-primary rounded border border-border-light flex items-start gap-2">
          <span className="text-info mt-0.5">ℹ</span>
          <p className="text-xs text-text-secondary leading-relaxed">
            留空时默认使用阿里云兼容地址；也可填写智谱、Kimi 等 OpenAI 兼容服务地址。
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => void handleSave()}
          loading={isSaving}
          disabled={isUnchanged}
          className="rounded-lg shadow-sm font-medium px-6 h-9"
        >
          保存配置
        </Button>
      </div>
      
      <p className="text-xs text-text-tertiary text-center pt-2 border-t border-border-light">
        配置会保存在本地，并在请求时通过当前服务端代理转发到你填写的模型服务。
      </p>
    </div>
  );
};

export default APIKeyInput;
