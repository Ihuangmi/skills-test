// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  time?: number;
}

// 角色预设类型
export interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
}

// 会话类型
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  role?: string; // 关联的角色 ID
}

// 模型配置类型
export interface ModelConfig {
  model: string;
  temperature: number;
  max_tokens: number;
}

// 用户配置类型
export interface UserConfig {
  apiKey: string;
  baseUrl: string;
  modelConfig: ModelConfig;
}

// API响应类型
export interface APIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 流式响应类型
export interface StreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

// 错误类型
export interface APIError {
  code: string;
  message: string;
  type: string;
}
