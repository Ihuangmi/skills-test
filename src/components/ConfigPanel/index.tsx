// 配置面板组件
import React from 'react';
import { Card, Typography, Divider } from 'antd';
import APIKeyInput from './APIKeyInput';
import ModelConfig from './ModelConfig';

const { Title } = Typography;

const ConfigPanel: React.FC = () => {
  return (
    <div 
      className="config-panel"
      style={{
        width: '300px',
        height: '100vh',
        borderLeft: '1px solid #f0f0f0',
        padding: '16px',
        overflowY: 'auto',
        backgroundColor: 'white',
      }}
    >
      <Title level={4} style={{ margin: 0, marginBottom: '24px' }}>设置</Title>
      
      <Card size="small" style={{ marginBottom: '16px' }}>
        <APIKeyInput />
        <Divider style={{ margin: '16px 0' }} />
        <ModelConfig />
      </Card>
      
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0, marginBottom: '16px' }}>关于</Title>
        <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
          这是一个基于React的类OpenAI聊天界面，支持与SiliconFlow平台的API交互。
        </Typography.Text>
        <br />
        <Typography.Text type="secondary" style={{ fontSize: '14px', marginTop: '8px', display: 'block' }}>
          版本: 1.0.0
        </Typography.Text>
      </Card>
    </div>
  );
};

export default ConfigPanel;