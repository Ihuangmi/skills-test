// 会话列表组件
import React, { useState } from 'react';
import { Button, Tooltip, Popconfirm, Input, Modal, Statistic, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, ExportOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useChat } from '../../hooks/useChat';
import { searchSessions, exportSessionToMarkdown, exportAllSessions, getStorageStats } from '../../utils/storage';

const ChatList: React.FC = () => {
  const {
    sessions,
    currentSessionId,
    createSession,
    switchSession,
    deleteSession,
  } = useChat();

  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 导出和统计弹窗
  const [showStatsModal, setShowStatsModal] = useState(false);

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

  // 搜索处理
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(!!query.trim());
  };

  // 获取显示的会话列表
  const displayedSessions = isSearching && searchQuery.trim()
    ? searchSessions(searchQuery).map(match => ({
        id: match.sessionId,
        title: match.sessionTitle,
        updatedAt: match.timestamp,
        preview: match.highlight || match.content,
        isSearchResult: true,
      }))
    : sessions.map(s => ({
        ...s,
        preview: s.messages.length > 0 ? s.messages[0].content : '无消息',
        isSearchResult: false,
      }));

  // 导出当前会话为 Markdown
  const handleExportCurrentSession = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    const markdown = exportSessionToMarkdown(session);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出所有会话为 JSON
  const handleExportAllSessions = () => {
    const json = exportAllSessions();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-sessions-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 获取统计信息
  const stats = getStorageStats();
  
  return (
    <div className="chat-sidebar">
      {/* 标题和操作按钮 */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">会话</h2>
        <div className="sidebar-actions">
          <Tooltip title="会话统计">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => setShowStatsModal(true)}
              size="small"
            />
          </Tooltip>
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
      </div>

      {/* 搜索框 */}
      <div className="sidebar-search">
        <Input
          placeholder="搜索会话内容..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          size="small"
        />
      </div>

      {/* 导出按钮 */}
      <div className="sidebar-export">
        <Button
          type="link"
          size="small"
          icon={<ExportOutlined />}
          onClick={handleExportCurrentSession}
          disabled={sessions.length === 0}
        >
          导出当前会话
        </Button>
        <Button
          type="link"
          size="small"
          icon={<ExportOutlined />}
          onClick={handleExportAllSessions}
          disabled={sessions.length === 0}
        >
          导出全部
        </Button>
      </div>

      {/* 会话列表 */}
      <div className="sidebar-content">
        {displayedSessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3 className="empty-state-title">
              {isSearching ? '未找到匹配结果' : '暂无会话'}
            </h3>
            <p className="empty-state-description">
              {isSearching
                ? '试试其他关键词'
                : '点击右上角按钮创建新会话'}
            </p>
          </div>
        ) : (
          displayedSessions.map((session: any) => {
            const isCurrentSession = session.id === currentSessionId;

            return (
              <div
                key={session.id + (session.isSearchResult ? '-search' : '')}
                className={`session-item ${isCurrentSession ? 'active' : ''}`}
                onClick={() => switchSession(session.id)}
              >
                {/* 会话标题和时间 */}
                <div className="session-meta">
                  <h4 className="session-title">
                    {session.title}
                    {session.isSearchResult && (
                      <span className="search-badge">搜索结果</span>
                    )}
                  </h4>
                  <span className="session-time">{formatTime(session.updatedAt)}</span>
                </div>

                {/* 会话摘要 */}
                <p className="session-preview">
                  {session.preview}
                </p>

                {/* 删除按钮（仅非搜索结果） */}
                {!session.isSearchResult && (
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
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 统计信息弹窗 */}
      <Modal
        title="会话统计"
        open={showStatsModal}
        onOk={() => setShowStatsModal(false)}
        onCancel={() => setShowStatsModal(false)}
        footer={null}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <Statistic title="会话数" value={stats.sessionCount} suffix="个" />
          <Statistic title="消息数" value={stats.messageCount} suffix="条" />
          <Statistic title="存储占用" value={stats.storageSizeKB} suffix="KB" />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <p><strong>最早会话：</strong>{stats.oldestSession ? stats.oldestSession.toLocaleString('zh-CN') : '无'}</p>
          <p><strong>最近会话：</strong>{stats.newestSession ? stats.newestSession.toLocaleString('zh-CN') : '无'}</p>
        </div>
        <div style={{ marginTop: '16px' }}>
          <p style={{ color: '#999', fontSize: '12px' }}>
            💡 提示：localStorage 限制约 5-10MB，当前使用 {stats.storageSizeMB}MB
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ChatList;