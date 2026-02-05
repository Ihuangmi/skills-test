// 聊天逻辑钩子
import { create } from 'zustand';
import type { ChatSession, Message } from '../types';
import { saveChatSessions, getChatSessions, saveCurrentSessionId, getCurrentSessionId } from '../utils/storage';
import { sendStreamChatRequest } from '../utils/api';
import { useConfig } from './useConfig';

interface ChatState {
  // 会话数据
  sessions: ChatSession[];
  currentSessionId: string;
  
  // 消息状态
  isSending: boolean;
  isStreaming: boolean;
  error: string | null;
  
  // 操作
  createSession: () => ChatSession;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  clearError: () => void;
  
  // 辅助方法
  getCurrentSession: () => ChatSession | undefined;
  updateSessionTitle: (sessionId: string, title: string) => void;
}

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 从本地存储加载会话
const loadSessions = (): { sessions: ChatSession[]; currentSessionId: string } => {
  const sessions = getChatSessions([]);
  const currentSessionId = getCurrentSessionId();
  
  // 如果没有会话，创建一个默认会话
  if (sessions.length === 0) {
    const defaultSession: ChatSession = {
      id: generateId(),
      title: '新会话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newSessions = [defaultSession];
    saveChatSessions(newSessions);
    saveCurrentSessionId(defaultSession.id);
    return { sessions: newSessions, currentSessionId: defaultSession.id };
  }
  
  // 如果当前会话ID不存在，使用第一个会话
  if (!currentSessionId || !sessions.find(s => s.id === currentSessionId)) {
    const firstSessionId = sessions[0].id;
    saveCurrentSessionId(firstSessionId);
    return { sessions, currentSessionId: firstSessionId };
  }
  
  return { sessions, currentSessionId };
};

// 创建聊天存储
export const useChat = create<ChatState>((set, get) => {
  const { sessions: initialSessions, currentSessionId: initialCurrentSessionId } = loadSessions();
  let abortStreaming: (() => void) | null = null;
  
  return {
    // 初始状态
    sessions: initialSessions,
    currentSessionId: initialCurrentSessionId,
    isSending: false,
    isStreaming: false,
    error: null,
    
    // 获取当前会话
    getCurrentSession: () => {
      return get().sessions.find(s => s.id === get().currentSessionId);
    },
    
    // 创建新会话
    createSession: () => {
      const newSession: ChatSession = {
        id: generateId(),
        title: '新会话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const newSessions = [...get().sessions, newSession];
      set({ 
        sessions: newSessions, 
        currentSessionId: newSession.id 
      });
      
      saveChatSessions(newSessions);
      saveCurrentSessionId(newSession.id);
      
      return newSession;
    },
    
    // 切换会话
    switchSession: (sessionId) => {
      set({ currentSessionId: sessionId });
      saveCurrentSessionId(sessionId);
    },
    
    // 删除会话
    deleteSession: (sessionId) => {
      const newSessions = get().sessions.filter(s => s.id !== sessionId);
      let newCurrentSessionId = get().currentSessionId;
      
      // 如果删除的是当前会话，切换到第一个会话
      if (sessionId === get().currentSessionId && newSessions.length > 0) {
        newCurrentSessionId = newSessions[0].id;
      }
      
      set({ 
        sessions: newSessions, 
        currentSessionId: newCurrentSessionId 
      });
      
      saveChatSessions(newSessions);
      saveCurrentSessionId(newCurrentSessionId);
    },
    
    // 更新会话标题
    updateSessionTitle: (sessionId, title) => {
      const newSessions = get().sessions.map(s => 
        s.id === sessionId ? { ...s, title } : s
      );
      set({ sessions: newSessions });
      saveChatSessions(newSessions);
    },
    
    // 发送消息
    sendMessage: async (content) => {
      const { apiKey, modelConfig } = useConfig.getState();
      
      // 验证API Key
      if (!apiKey) {
        set({ error: '请先设置API Key' });
        return;
      }
      
      // 验证内容
      if (!content.trim()) {
        set({ error: '消息内容不能为空' });
        return;
      }
      
      const currentSession = get().getCurrentSession();
      if (!currentSession) return;
      
      // 清除之前的错误
      set({ error: null, isSending: true });
      
      // 创建用户消息
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      
      // 创建助手消息（用于流式响应）
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      
      // 更新会话消息
      const updatedSession: ChatSession = {
        ...currentSession,
        messages: [...currentSession.messages, userMessage, assistantMessage],
        updatedAt: Date.now(),
      };
      
      const updatedSessions = get().sessions.map(s => 
        s.id === currentSession.id ? updatedSession : s
      );
      
      set({ 
        sessions: updatedSessions,
        isStreaming: true,
      });
      
      saveChatSessions(updatedSessions);
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 发送流式请求
      abortStreaming = sendStreamChatRequest(
        apiKey,
        updatedSession.messages,
        modelConfig,
        (chunk) => {
          // 更新助手消息内容
          const session = get().getCurrentSession();
          if (!session) return;
          
          const lastMessage = session.messages[session.messages.length - 1];
          if (lastMessage.role === 'assistant') {
            const updatedMessages = [...session.messages];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + chunk,
            };
            
            const newSession = {
              ...session,
              messages: updatedMessages,
            };
            
            const newSessions = get().sessions.map(s => 
              s.id === session.id ? newSession : s
            );
            
            set({ sessions: newSessions });
            saveChatSessions(newSessions);
          }
        },
        () => {
          // 流式响应完成
          const session = get().getCurrentSession();
          if (!session) return;
          
          // 计算响应时间
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          // 更新助手消息，添加响应时间
          const updatedMessages = [...session.messages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              time: responseTime,
            };
            
            const newSession = {
              ...session,
              messages: updatedMessages,
            };
            
            const newSessions = get().sessions.map(s => 
              s.id === session.id ? newSession : s
            );
            
            set({ 
              sessions: newSessions,
              isSending: false,
              isStreaming: false,
            });
            
            saveChatSessions(newSessions);
            
            // 如果是第一个助手消息，更新会话标题
            if (session.messages.length === 2) {
              const firstAssistantMessage = updatedMessages[1];
              if (firstAssistantMessage.content) {
                // 提取前20个字符作为标题
                const title = firstAssistantMessage.content.substring(0, 20) + (firstAssistantMessage.content.length > 20 ? '...' : '');
                get().updateSessionTitle(session.id, title);
              }
            }
          }
        },
        (error) => {
          // 处理错误
          set({ 
            error: error.message,
            isSending: false,
            isStreaming: false,
          });
          
          // 从会话中移除空的助手消息
          const session = get().getCurrentSession();
          if (!session) return;
          
          const updatedMessages = session.messages.filter(msg => 
            !(msg.role === 'assistant' && msg.content === '')
          );
          
          const newSession = {
            ...session,
            messages: updatedMessages,
          };
          
          const newSessions = get().sessions.map(s => 
            s.id === session.id ? newSession : s
          );
          
          set({ sessions: newSessions });
          saveChatSessions(newSessions);
        }
      );
    },
    
    // 停止流式响应
    stopStreaming: () => {
      if (abortStreaming) {
        abortStreaming();
        abortStreaming = null;
      }
      set({ isStreaming: false, isSending: false });
    },
    
    // 清除错误
    clearError: () => {
      set({ error: null });
    },
  };
});