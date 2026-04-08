import React, { useEffect, useMemo } from 'react';
import { AutoComplete, Select, message } from 'antd';
import { useConfig } from '../../hooks/useConfig';

const ModelSelector: React.FC = () => {
  const {
    modelConfig,
    setModelConfig,
    availableModels,
    fetchAvailableModels,
    error,
  } = useConfig();



  useEffect(() => {
    void fetchAvailableModels();
  }, [fetchAvailableModels]);

  const modelOptions = useMemo(() => {
    const options = availableModels.map((model) => ({
      value: model.id,
      label: model.name,
    }));

    return options;
  }, [availableModels]);

  const handleModelChange = (model: string) => {
    setModelConfig({ model });
  };

  const handleModelSelect = (model: string) => {
    handleModelChange(model);
    message.info(`已切换到模型: ${model}`);
  };

  return (
    <div className="flex items-center gap-1.5 bg-bg-secondary/50 p-1 rounded-xl border border-border-light/50 backdrop-blur-sm">
      <AutoComplete
        value={modelConfig.model}
        options={modelOptions}
        onChange={handleModelChange}
        onSelect={handleModelSelect}
        className="w-40 sm:w-56"
        popupMatchSelectWidth={false}
        placeholder="选择或输入模型"
        bordered={false}
        status={error ? 'warning' : ''}
      >
        <Select.Option value={modelConfig.model}>{modelConfig.model}</Select.Option>
      </AutoComplete>

      <div className="w-px h-4 bg-border-light mx-0.5"></div>


    </div>
  );
};

export default ModelSelector;
