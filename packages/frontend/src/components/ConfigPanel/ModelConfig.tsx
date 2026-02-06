// 模型配置组件
import React, { useEffect } from 'react';
import { Select, Slider, Typography, Form, InputNumber, message } from 'antd';
import { useConfig } from '../../hooks/useConfig';

const { Text } = Typography;

const ModelConfig: React.FC = () => {
  const { 
    modelConfig, 
    setModelConfig, 
    availableModels, 
    fetchAvailableModels, 
    isLoading 
  } = useConfig();
  
  // 当组件挂载时，尝试获取可用模型
  useEffect(() => {
    fetchAvailableModels();
  }, []);
  
  // 处理模型选择变化
  const handleModelChange = (model: string) => {
    setModelConfig({ model });
    message.info(`已切换到模型: ${model}`);
  };
  
  // 处理temperature变化
  const handleTemperatureChange = (value: number) => {
    setModelConfig({ temperature: value });
  };
  
  // 处理max_tokens变化
  const handleMaxTokensChange = (value: number) => {
    setModelConfig({ max_tokens: value });
  };
  
  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: '8px' }}>模型配置</Text>
      
      <Form layout="vertical" size="small">
        {/* 模型选择 */}
        <Form.Item label="模型" required>
          <Select
            value={modelConfig.model}
            onChange={handleModelChange}
            options={availableModels.map(model => ({
              value: model.id,
              label: model.name,
            }))}
            loading={isLoading}
            style={{ width: '100%' }}
            placeholder="选择模型"
          />
        </Form.Item>
        
        {/* Temperature设置 */}
        <Form.Item label={`Temperature: ${modelConfig.temperature}`}>
          <Slider
            min={0}
            max={2}
            step={0.1}
            value={modelConfig.temperature}
            onChange={handleTemperatureChange}
            marks={{
              0: '0',
              1: '1',
              2: '2',
            }}
          />
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
            控制输出的随机性，值越高越随机
          </Text>
        </Form.Item>
        
        {/* Max Tokens设置 */}
        <Form.Item label={`Max Tokens: ${modelConfig.max_tokens}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Slider
              min={1}
              max={4096}
              step={100}
              value={modelConfig.max_tokens}
              onChange={handleMaxTokensChange}
              style={{ flex: 1 }}
              marks={{
                1: '1',
                2048: '2048',
                4096: '4096',
              }}
            />
            <InputNumber
              min={1}
              max={4096}
              step={100}
              value={modelConfig.max_tokens}
              onChange={(value) => value && handleMaxTokensChange(value)}
              style={{ width: '100px' }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
            控制最大输出长度
          </Text>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ModelConfig;