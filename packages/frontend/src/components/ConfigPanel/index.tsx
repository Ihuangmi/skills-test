// 配置面板组件
import React from 'react';
import { Modal } from 'antd';
import APIKeyInput from './APIKeyInput';
import ModelConfig from './ModelConfig';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      title="设置"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      {/* 配置面板内容 */}
      <div className="overflow-y-auto p-4">
        {/* API Key配置 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">API 配置</h3>
          <APIKeyInput />
        </div>
        
        {/* 模型配置 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">模型配置</h3>
          <ModelConfig />
        </div>
        
        {/* 关于信息 */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">关于</h3>
          <div className="bg-bg-tertiary p-4 rounded-lg">
            <p className="text-sm text-text-secondary mb-2">
              这是一个基于React的类OpenAI聊天界面，支持与阿里云百炼（通义千问）平台的API交互。
            </p>
            <p className="text-xs text-text-tertiary">
              版本: 1.0.0
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfigPanel;