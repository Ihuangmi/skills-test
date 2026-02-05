// 会话列表组件
import React from 'react';
import { Button, Typography, Tooltip, Popconfirm, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useChat } from '../../hooks/useChat';
import type { ChatSession } from '../../types';

const { Text } = Typography;

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
    <div 
      className="chat-list"
      style={{
        width: '280px',
        height: '100vh',
        borderRight: '1px solid #f0f0f0',
        padding: '16px',
        overflowY: 'auto',
        backgroundColor: 'white',
      }}
    >
      {/* 标题和新建按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>会话</Typography.Title>
        <Tooltip title="新建会话">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createSession}
            shape="circle"
          />
        </Tooltip>
      </div>
      
      {/* 会话列表 */}
      <div style={{ height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        {sessions.length === 0 ? (
          <Empty description="暂无会话" />
        ) : (
          sessions.map((session) => {
            const isCurrentSession = session.id === currentSessionId;
            
            return (
              <div
                key={session.id}
                style={{
                  borderRadius: '8px',
                  marginBottom: '8px',
                  backgroundColor: isCurrentSession ? '#e6f7ff' : 'transparent',
                  border: isCurrentSession ? '1px solid #91d5ff' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: '12px',
                  position: 'relative',
                }}
                onClick={() => switchSession(session.id)}
                onMouseEnter={(e) => {
                  const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                  if (deleteBtn) {
                    deleteBtn.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                  if (deleteBtn) {
                    deleteBtn.style.opacity = '0';
                  }
                }}
              >
                {/* 会话标题和时间 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <Text 
                    strong 
                    ellipsis 
                    style={{ 
                      fontSize: '14px',
                      color: isCurrentSession ? '#1890ff' : 'inherit',
                    }}
                  >
                    {session.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatTime(session.updatedAt)}
                  </Text>
                </div>
                
                {/* 会话摘要 */}
                <Text 
                  type="secondary" 
                  ellipsis 
                  style={{ 
                    fontSize: '12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {session.messages.length > 0 
                    ? session.messages[0].content 
                    : '无消息'}
                </Text>
                
                {/* 删除按钮 */}
                <div 
                  className="delete-btn"
                  style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px', 
                    opacity: 0, 
                    transition: 'opacity 0.3s ease'
                  }}
                >
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
                      style={{ fontSize: '12px' }}
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