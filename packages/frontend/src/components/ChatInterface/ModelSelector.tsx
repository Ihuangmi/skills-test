import React, { useState, useEffect, useMemo } from 'react';
import { AutoComplete, Select, Popover, Slider, InputNumber, Button, message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useConfig } from '../../hooks/useConfig';

const ModelSelector: React.FC = () => {
  const {
    modelConfig,
    setModelConfig,
    availableModels,
    fetchAvailableModels,
    error,
  } = useConfig();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    void fetchAvailableModels();
  }, [fetchAvailableModels]);

  const modelOptions = useMemo(() => {
    const options = availableModels.map((model) => ({
      value: model.id,
      label: model.name,
    }));

    // if (
    //   modelConfig.model &&
    //   !options.some((option) => option.value === modelConfig.model)
    // ) {
    //   return [{ value: modelConfig.model, label: modelConfig.model }, ...options];
    // }

    return options;
  }, [availableModels, modelConfig.model]);

  const handleModelChange = (model: string) => {
    setModelConfig({ model });
  };

  const handleModelSelect = (model: string) => {
    handleModelChange(model);
    message.info(`已切换到模型: ${model}`);
  };

  const handleTemperatureChange = (value: number) => {
    setModelConfig({ temperature: value });
  };

  const handleMaxTokensChange = (value: number) => {
    setModelConfig({ max_tokens: value });
  };

  const advancedSettings = (
    <div className="w-72 p-2">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-text-primary">Temperature</span>
          <span className="text-xs text-text-tertiary">{modelConfig.temperature}</span>
        </div>
        <Slider
          min={0}
          max={2}
          step={0.1}
          value={modelConfig.temperature}
          onChange={handleTemperatureChange}
          tooltip={{ formatter: null }}
          className="mx-2"
        />
        <p className="text-xs text-text-tertiary mt-1">控制输出的随机性，值越高越随机</p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-text-primary">Max Tokens</span>
          <span className="text-xs text-text-tertiary">{modelConfig.max_tokens}</span>
        </div>
        <div className="flex items-center gap-3">
          <Slider
            min={1}
            max={8192}
            step={100}
            value={modelConfig.max_tokens}
            onChange={handleMaxTokensChange}
            tooltip={{ formatter: null }}
            className="flex-1 mx-2"
          />
          <InputNumber
            min={1}
            max={8192}
            step={100}
            value={modelConfig.max_tokens}
            onChange={(value) => value && handleMaxTokensChange(value)}
            size="small"
            className="w-16"
          />
        </div>
        <p className="text-xs text-text-tertiary mt-1">控制单次回答的最大长度</p>
      </div>
    </div>
  );

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
        // filterOption={(inputValue, option) =>
        //   (option?.value ?? '')
        //     .toLowerCase()
        //     .includes(inputValue.toLowerCase())
        // }
        status={error ? 'warning' : ''}
      >
        <Select.Option value={modelConfig.model}>{modelConfig.model}</Select.Option>
      </AutoComplete>

      <div className="w-px h-4 bg-border-light mx-0.5"></div>

      {/* <Popover
        content={advancedSettings}
        title={<span className="text-sm font-semibold text-primary flex items-center gap-2"><SettingOutlined /> 高级配置</span>}
        trigger="click"
        open={isOpen}
        onOpenChange={setIsOpen}
        placement="bottomRight"
        arrow={false}
      >
        <Button 
          type="text" 
          icon={<SettingOutlined className={`transition-colors ${isOpen ? 'text-primary' : 'text-text-tertiary'}`} />} 
          className={`flex items-center justify-center rounded-lg hover:bg-bg-tertiary ${isOpen ? 'bg-primary/10' : ''}`}
        />
      </Popover> */}
    </div>
  );
};

export default ModelSelector;
