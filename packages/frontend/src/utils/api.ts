// API调用工具
import axios, { AxiosError } from "axios";
import type {
  APIResponse,
  StreamResponse,
  Message,
  ModelConfig,
  APIError,
} from "../types";

// 本地服务端API基础URL（使用相对路径，通过Vite代理访问）
const API_BASE_URL = "/api/v1";

/**
 * 创建axios实例
 */
const createAxiosInstance = (apiKey: string) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
};

/**
 * 发送聊天请求
 */
export const sendChatRequest = async (
  apiKey: string,
  messages: Message[],
  modelConfig: ModelConfig,
): Promise<APIResponse> => {
  const instance = createAxiosInstance(apiKey);

  try {
    const response = await instance.post<APIResponse>("/chat/completions", {
      model: modelConfig.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.max_tokens,
      stream: false,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;
      throw new Error(axiosError.response?.data?.message || "API请求失败");
    }
    throw new Error("网络请求失败");
  }
};

/**
 * 发送流式聊天请求
 */
export const sendStreamChatRequest = (
  apiKey: string,
  messages: Message[],
  modelConfig: ModelConfig,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
): (() => void) => {
  const controller = new AbortController();
  const signal = controller.signal;

  // 简化的流式请求处理
  const fetchStream = async () => {
    try {
      // 构建请求参数
      const requestData = {
        model: modelConfig.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens,
        stream: true,
      };

      // 添加日志
      console.log("发送流式请求:", {
        url: `${API_BASE_URL}/chat/completions`,
        apiKey: apiKey ? "***" + apiKey.slice(-4) : "空",
        model: modelConfig.model,
        messageCount: messages.length,
        stream: true,
      });

      // 发送请求
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestData),
        signal,
      });

      // 添加日志
      console.log("响应状态:", response.status, response.statusText);

      // 检查响应状态
      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.log("错误响应:", errorData);
          throw new Error(errorData.error?.message || "API请求失败");
        } catch (e) {
          console.log("解析错误响应失败:", e);
          throw new Error(`请求失败: ${response.status}`);
        }
      }

      // 检查响应体
      if (!response.body) {
        throw new Error("响应体为空");
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete();
          break;
        }

        // 解码数据
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        // 处理每一行
        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") {
              onComplete();
              return;
            }

            // 简化的JSON解析和错误处理
            try {
              const data = JSON.parse(dataStr);

              // 检查错误
              if (data.error) {
                throw new Error(data.error.message || "API请求失败");
              }

              // 安全地获取content
              if (data.choices && Array.isArray(data.choices)) {
                const choice = data.choices[0];
                if (choice && choice.delta && choice.delta.content) {
                  onChunk(choice.delta.content);
                }
              }
            } catch (error) {
              console.error("解析响应失败:", error);
              if (!signal.aborted) {
                onError(
                  error instanceof Error ? error : new Error("解析响应失败"),
                );
              }
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error("流式请求失败:", error);
      if (!signal.aborted) {
        onError(error instanceof Error ? error : new Error("流式请求失败"));
      }
    }
  };

  // 启动请求
  fetchStream();

  // 返回中止函数
  return () => controller.abort();
};

/**
 * 获取可用模型列表
 */
export const getAvailableModels = async (
  apiKey: string,
): Promise<Array<{ id: string; name: string }>> => {
  const instance = createAxiosInstance(apiKey);

  try {
    const response = await instance.get("/models");
    return response.data.data.map((model: any) => ({
      id: model.id,
      name: model.id,
    }));
  } catch (error) {
    console.error("获取模型列表失败:", error);
    // 返回默认模型
    return [
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
      { id: "gpt-4", name: "GPT-4" },
    ];
  }
};
