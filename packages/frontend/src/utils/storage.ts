// 本地存储工具

const STORAGE_KEYS = {
  API_KEY: 'chatgpt-clone-api-key',
  USER_CONFIG: 'chatgpt-clone-user-config',
  CHAT_SESSIONS: 'chatgpt-clone-chat-sessions',
  CURRENT_SESSION: 'chatgpt-clone-current-session',
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
 * 保存API Key
 */
export const saveAPIKey = (apiKey: string): void => {
  saveToStorage(STORAGE_KEYS.API_KEY, apiKey);
};

/**
 * 获取API Key
 */
export const getAPIKey = (): string => {
  return getFromStorage<string>(STORAGE_KEYS.API_KEY, '');
};

/**
 * 保存用户配置
 */
export const saveUserConfig = (config: any): void => {
  saveToStorage(STORAGE_KEYS.USER_CONFIG, config);
};

/**
 * 获取用户配置
 */
export const getUserConfig = (defaultValue: any): any => {
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
 * 保存当前会话ID
 */
export const saveCurrentSessionId = (sessionId: string): void => {
  saveToStorage(STORAGE_KEYS.CURRENT_SESSION, sessionId);
};

/**
 * 获取当前会话ID
 */
export const getCurrentSessionId = (): string => {
  return getFromStorage<string>(STORAGE_KEYS.CURRENT_SESSION, '');
};