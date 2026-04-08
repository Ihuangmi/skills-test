// 本地存储工具
import type { UserConfig } from '../types';

// 版本管理：用于 schema 迁移
const STORAGE_VERSION = 1;
const STORAGE_KEYS = {
  API_KEY: 'chatgpt-clone-api-key',
  USER_CONFIG: 'chatgpt-clone-user-config',
  CHAT_SESSIONS: 'chatgpt-clone-chat-sessions',
  CURRENT_SESSION: 'chatgpt-clone-current-session',
  STORAGE_VERSION: 'chatgpt-clone-storage-version',
};

/**
 * 保存数据到本地存储
 */
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * 从本地存储读取数据
 */
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

/**
 * 删除本地存储中的数据
 */
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

/**
 * 保存 API Key
 */
export const saveAPIKey = (apiKey: string): void => {
  saveToStorage(STORAGE_KEYS.API_KEY, apiKey);
};

/**
 * 获取 API Key
 */
export const getAPIKey = (): string => {
  return getFromStorage<string>(STORAGE_KEYS.API_KEY, '');
};

/**
 * 保存用户配置
 */
export const saveUserConfig = (config: Partial<UserConfig>): void => {
  saveToStorage(STORAGE_KEYS.USER_CONFIG, config);
};

/**
 * 获取用户配置
 */
export const getUserConfig = (
  defaultValue: Partial<UserConfig>,
): Partial<UserConfig> => {
  return getFromStorage(STORAGE_KEYS.USER_CONFIG, defaultValue);
};

/**
 * 保存聊天会话
 */
export const saveChatSessions = (sessions: any[]): void => {
  saveToStorage(STORAGE_KEYS.CHAT_SESSIONS, sessions);
};

/**
 * 获取聊天会话
 */
export const getChatSessions = (defaultValue: any[]): any[] => {
  return getFromStorage(STORAGE_KEYS.CHAT_SESSIONS, defaultValue);
};

/**
 * 保存当前会话 ID
 */
export const saveCurrentSessionId = (sessionId: string): void => {
  saveToStorage(STORAGE_KEYS.CURRENT_SESSION, sessionId);
};

/**
 * 获取当前会话 ID
 */
export const getCurrentSessionId = (): string => {
  return getFromStorage<string>(STORAGE_KEYS.CURRENT_SESSION, '');
};

// ─── 高级功能：搜索、导出、版本管理 ─────────────────────────────────────

/**
 * 获取存储版本
 */
export const getStorageVersion = (): number => {
  return getFromStorage<number>(STORAGE_KEYS.STORAGE_VERSION, 0);
};

/**
 * 初始化存储版本（首次使用时调用）
 */
export const initStorageVersion = (): void => {
  const currentVersion = getStorageVersion();
  if (currentVersion === 0) {
    saveToStorage(STORAGE_KEYS.STORAGE_VERSION, STORAGE_VERSION);
  }
  // 未来版本升级可以在这里添加迁移逻辑
};

/**
 * 搜索会话内容
 * @param query 搜索关键词
 * @returns 匹配的消息及其所属会话
 */
export interface SearchMatch {
  sessionId: string;
  sessionTitle: string;
  messageId: string;
  messageRole: 'user' | 'assistant';
  content: string;
  timestamp: number;
  // 高亮片段（可选）
  highlight?: string;
}

export const searchSessions = (query: string): SearchMatch[] => {
  if (!query.trim()) return [];

  const sessions = getChatSessions([]);
  const lowerQuery = query.toLowerCase();
  const results: SearchMatch[] = [];

  for (const session of sessions) {
    for (const message of session.messages) {
      if (message.content.toLowerCase().includes(lowerQuery)) {
        // 生成高亮片段（显示匹配词前后各 30 个字符）
        const index = message.content.toLowerCase().indexOf(lowerQuery);
        const start = Math.max(0, index - 30);
        const end = Math.min(message.content.length, index + lowerQuery.length + 30);
        const highlight =
          (start > 0 ? '...' : '') +
          message.content.slice(start, end) +
          (end < message.content.length ? '...' : '');

        results.push({
          sessionId: session.id,
          sessionTitle: session.title,
          messageId: message.id,
          messageRole: message.role,
          content: message.content,
          timestamp: message.timestamp,
          highlight,
        });
      }
    }
  }

  // 按时间倒序返回
  return results.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * 导出会话为 Markdown
 */
export const exportSessionToMarkdown = (session: any): string => {
  const lines: string[] = [];

  // 标题
  lines.push(`# ${session.title}`);
  lines.push('');
  lines.push(`创建时间：${new Date(session.createdAt).toLocaleString('zh-CN')}`);
  lines.push(`更新时间：${new Date(session.updatedAt).toLocaleString('zh-CN')}`);
  lines.push(`消息数量：${session.messages.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // 消息
  for (const message of session.messages) {
    const role = message.role === 'user' ? '👤 用户' : '🤖 助手';
    const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString('zh-CN') : '';

    lines.push(`### ${role} ${time}`);
    lines.push('');
    lines.push('```');
    lines.push(message.content);
    lines.push('```');
    lines.push('');

    if (message.time) {
      lines.push(`_响应时间：${message.time}ms_`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
};

/**
 * 导出会话为 JSON
 */
export const exportSessionToJSON = (session: any): string => {
  return JSON.stringify(session, null, 2);
};

/**
 * 导出所有会话
 */
export const exportAllSessions = (): string => {
  const sessions = getChatSessions([]);
  return JSON.stringify({
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    sessions,
  }, null, 2);
};

/**
 * 批量删除会话
 */
export const deleteSessions = (sessionIds: string[]): void => {
  const sessions = getChatSessions([]);
  const newSessions = sessions.filter(s => !sessionIds.includes(s.id));
  saveChatSessions(newSessions);
};

/**
 * 清空所有会话
 */
export const clearAllSessions = (): void => {
  saveChatSessions([]);
  removeFromStorage(STORAGE_KEYS.CURRENT_SESSION);
};

/**
 * 获取统计信息
 */
export const getStorageStats = () => {
  const sessions = getChatSessions([]);
  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
  const totalSize = new Blob([JSON.stringify(sessions)]).size;

  return {
    sessionCount: sessions.length,
    messageCount: totalMessages,
    storageSize: totalSize,
    storageSizeKB: (totalSize / 1024).toFixed(2),
    storageSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    oldestSession: sessions.length > 0 ? new Date(sessions[sessions.length - 1].createdAt) : null,
    newestSession: sessions.length > 0 ? new Date(sessions[0].createdAt) : null,
  };
};
