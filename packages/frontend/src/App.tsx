import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { MenuOutlined, SettingOutlined, MenuFoldOutlined, UserOutlined } from '@ant-design/icons';
import ChatList from './components/ChatInterface/ChatList';
import ChatMain from './components/ChatInterface/ChatMain';
import ConfigPanel from './components/ConfigPanel';
import LoginModal from './components/LoginModal';

const App: React.FC = () => {
  const [showChatList, setShowChatList] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <Tooltip title={showChatList ? '隐藏会话列表' : '显示会话列表'}>
              <Button
                type="text"
                icon={showChatList ? <MenuFoldOutlined /> : <MenuOutlined />}
                onClick={() => setShowChatList(!showChatList)}
                className="header-btn"
              />
            </Tooltip>

            <h1 className="header-title">
              SiliconFlow Chat
            </h1>
          </div>

          <div className="header-actions">
            <Tooltip title="登录">
              <Button
                type="text"
                icon={<UserOutlined />}
                onClick={() => setShowLoginModal(true)}
                className="header-btn"
              />
            </Tooltip>

            <Tooltip title={showConfigPanel ? '隐藏设置' : '显示设置'}>
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={() => setShowConfigPanel(!showConfigPanel)}
                className="header-btn"
              />
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="main-content">
        {showChatList && (
          <ChatList />
        )}

        <ChatMain />

        {showConfigPanel && (
          <ConfigPanel />
        )}
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default App;
