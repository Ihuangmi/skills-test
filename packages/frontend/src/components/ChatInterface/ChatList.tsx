// 会话列表组件
import React from 'react';
import { Button, Tooltip, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useChat } from '../../hooks/useChat';

const ChatList: React.FC = () => {
  const {
    sessions,
    currentSessionId,
    createSession,
    switchSession,
    deleteSession,
  } = useChat();
  
  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };
  
  return (
    <div className="chat-sidebar">
      {/* 标题和新建按钮 */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">会话</h2>
        <Tooltip title="新建会话">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createSession}
            shape="circle"
            className="btn-primary"
          />
        </Tooltip>
      </div>
      
      {/* 会话列表 */}
      <div className="sidebar-content">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3 className="empty-state-title">暂无会话</h3>
            <p className="empty-state-description">点击右上角按钮创建新会话</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isCurrentSession = session.id === currentSessionId;
            
            return (
              <div
                key={session.id}
                className={`session-item ${isCurrentSession ? 'active' : ''}`}
                onClick={() => switchSession(session.id)}
              >
                {/* 会话标题和时间 */}
                <div className="session-meta">
                  <h4 className="session-title">{session.title}</h4>
                  <span className="session-time">{formatTime(session.updatedAt)}</span>
                </div>
                
                {/* 会话摘要 */}
                <p className="session-preview">
                  {session.messages.length > 0 
                    ? session.messages[0].content 
                    : '无消息'}
                </p>
                
                {/* 删除按钮 */}
                <div className="session-actions">
                  <Popconfirm
                    title="确定要删除这个会话吗？"
                    onConfirm={() => deleteSession(session.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      className="session-delete-btn"
                    />
                  </Popconfirm>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;