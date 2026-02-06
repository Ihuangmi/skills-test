// 配置面板组件
import React from 'react';
import APIKeyInput from './APIKeyInput';
import ModelConfig from './ModelConfig';

const ConfigPanel: React.FC = () => {
  return (
    <div className="config-panel">
      {/* 配置面板头部 */}
      <div className="config-header">
        <h2 className="config-title">设置</h2>
      </div>
      
      {/* 配置面板内容 */}
      <div className="config-content">
        {/* API Key配置 */}
        <div className="config-section">
          <h3 className="config-section-title">API 配置</h3>
          <APIKeyInput />
        </div>
        
        {/* 模型配置 */}
        <div className="config-section">
          <h3 className="config-section-title">模型配置</h3>
          <ModelConfig />
        </div>
        
        {/* 关于信息 */}
        <div className="config-section">
          <h3 className="config-section-title">关于</h3>
          <div className="card">
            <p className="config-about-text">
              这是一个基于React的类OpenAI聊天界面，支持与SiliconFlow平台的API交互。
            </p>
            <p className="config-about-version">
              版本: 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;