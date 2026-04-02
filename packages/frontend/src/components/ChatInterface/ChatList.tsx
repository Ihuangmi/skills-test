// 会话列表组件
import React, { useState } from 'react';
import { Button, Tooltip, Popconfirm, Input, Modal, Statistic } from 'antd';
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
    <div className="w-[300px] bg-bg-primary border-r border-border-default flex flex-col relative overflow-hidden h-full min-h-0 flex-shrink-0">
      {/* 标题和操作按钮 */}
      <div className="p-4 border-b border-border-default flex justify-between items-center sticky top-0 bg-bg-primary z-10">
        <h2 className="text-lg font-semibold text-text-primary">会话</h2>
        <div className="flex items-center gap-2">
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
              className="bg-primary hover:bg-primary-dark"
            />
          </Tooltip>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="p-3 border-b border-border-default">
        <Input
          placeholder="搜索会话内容..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          size="small"
          className="w-full"
        />
      </div>

      {/* 导出按钮 */}
      <div className="p-2 border-b border-border-default flex gap-2 flex-wrap">
        <Button
          type="link"
          size="small"
          icon={<ExportOutlined />}
          onClick={handleExportCurrentSession}
          disabled={sessions.length === 0}
          className="text-sm px-2 text-text-secondary hover:text-primary"
        >
          导出当前会话
        </Button>
        <Button
          type="link"
          size="small"
          icon={<ExportOutlined />}
          onClick={handleExportAllSessions}
          disabled={sessions.length === 0}
          className="text-sm px-2 text-text-secondary hover:text-primary"
        >
          导出全部
        </Button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {displayedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center text-2xl text-text-tertiary mb-4">💬</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {isSearching ? '未找到匹配结果' : '暂无会话'}
            </h3>
            <p className="text-sm text-text-secondary max-w-[300px]">
              {isSearching
                ? '试试其他关键词'
                : '点击右上角按钮创建新会话'}
            </p>
          </div>
        ) : (
          displayedSessions.map((session: { id: string; title: string; updatedAt: number; preview: string; isSearchResult: boolean }) => {
            const isCurrentSession = session.id === currentSessionId;

            return (
              <div
                key={session.id + (session.isSearchResult ? '-search' : '')}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-all duration-normal relative border ${isCurrentSession ? 'bg-primary-lightest border-primary shadow-[0_2px_6px_rgba(109,40,217,0.15)]' : 'bg-bg-primary border-transparent shadow-sm hover:bg-bg-secondary hover:translate-x-1 hover:border-primary-light hover:shadow-md'}`}
                onClick={() => switchSession(session.id)}
              >
                {/* 会话标题和时间 */}
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-text-primary text-sm leading-relaxed">
                    {session.title}
                    {session.isSearchResult && (
                      <span className="ml-1 text-xs bg-primary text-white px-1 py-0.5 rounded-sm">搜索结果</span>
                    )}
                  </h4>
                  <span className="text-xs text-text-tertiary">{formatTime(session.updatedAt)}</span>
                </div>

                {/* 会话摘要 */}
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-1 mb-2">
                  {session.preview}
                </p>

                {/* 删除按钮（仅非搜索结果） */}
                {!session.isSearchResult && (
                  <div className="absolute top-2 right-2 opacity-0 transition-opacity duration-fast group-hover:opacity-100">
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
                        className="text-xs"
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
        <div className="flex flex-wrap gap-4 mb-6">
          <Statistic title="会话数" value={stats.sessionCount} suffix="个" />
          <Statistic title="消息数" value={stats.messageCount} suffix="条" />
          <Statistic title="存储占用" value={stats.storageSizeKB} suffix="KB" />
        </div>
        <div className="mb-4">
          <p className="mb-2"><strong>最早会话：</strong>{stats.oldestSession ? stats.oldestSession.toLocaleString('zh-CN') : '无'}</p>
          <p><strong>最近会话：</strong>{stats.newestSession ? stats.newestSession.toLocaleString('zh-CN') : '无'}</p>
        </div>
        <div className="mt-4">
          <p className="text-xs text-text-tertiary">
            💡 提示：localStorage 限制约 5-10MB，当前使用 {stats.storageSizeMB}MB
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ChatList;