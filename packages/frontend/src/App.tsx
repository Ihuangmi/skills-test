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
    <div className="h-screen flex flex-col bg-bg-secondary overflow-hidden">
      <header className="bg-bg-primary shadow-sm sticky top-0 z-10 p-4 px-6 transition-all duration-normal hover:shadow-md">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <Tooltip title={showChatList ? '隐藏会话列表' : '显示会话列表'}>
              <Button
                type="text"
                icon={showChatList ? <MenuFoldOutlined /> : <MenuOutlined />}
                onClick={() => setShowChatList(!showChatList)}
                className="text-text-secondary hover:text-primary transition-all duration-fast text-base"
              />
            </Tooltip>

            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              Chat
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip title="登录">
              <Button
                type="text"
                icon={<UserOutlined />}
                onClick={() => setShowLoginModal(true)}
                className="text-text-secondary hover:text-primary transition-all duration-fast text-base"
              />
            </Tooltip>

            <Tooltip title={showConfigPanel ? '隐藏设置' : '显示设置'}>
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={() => setShowConfigPanel(!showConfigPanel)}
                className="text-text-secondary hover:text-primary transition-all duration-fast text-base"
              />
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="flex-1 flex max-w-[1400px] mx-auto w-full h-full overflow-hidden">
        {showChatList && (
          <ChatList />
        )}

        <ChatMain />
      </main>

      <ConfigPanel
        isOpen={showConfigPanel}
        onClose={() => setShowConfigPanel(false)}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default App;
