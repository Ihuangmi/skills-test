import React from 'react';
import { Modal } from 'antd';
import APIKeyInput from './APIKeyInput';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      title={
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-info mb-2 mt-1">
          系统设置
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      className="backdrop-blur-sm"
    >
      <div className="overflow-y-auto overflow-x-hidden">
        <div className="mb-6 bg-bg-secondary p-5 rounded-xl border border-border-light shadow-sm relative overflow-hidden">
          {/* 装饰性背景 */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none"></div>
          
          <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2 relative z-10">
            <span className="text-lg">🔑</span> API 连接配置
          </h3>
          <div className="relative z-10">
            <APIKeyInput />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 pl-1">关于</h3>
          <div className="bg-bg-tertiary p-4 rounded-xl border border-border-light/50 relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-info/5 rounded-full -mr-10 -mb-10 blur-2xl group-hover:bg-info/10 transition-colors"></div>
            <p className="text-sm text-text-secondary mb-2 relative z-10 leading-relaxed">
              这是一个基于 React 的现代聊天界面，支持通过本地配置接入不同的兼容模型服务。
            </p>
            <p className="text-xs text-text-tertiary relative z-10 font-mono">
              v1.0.0
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfigPanel;
