// 应用主组件
import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { MenuOutlined, SettingOutlined, MenuFoldOutlined } from '@ant-design/icons';
import ChatList from './components/ChatInterface/ChatList';
import ChatMain from './components/ChatInterface/ChatMain';
import ConfigPanel from './components/ConfigPanel';

const App: React.FC = () => {
  const [showChatList, setShowChatList] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  return (
    <div className="app-container">
      {/* 头部 */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            {/* 菜单切换按钮 */}
            <Tooltip title={showChatList ? '隐藏会话列表' : '显示会话列表'}>
              <Button
                type="text"
                icon={showChatList ? <MenuFoldOutlined /> : <MenuOutlined />}
                onClick={() => setShowChatList(!showChatList)}
                className="header-btn"
              />
            </Tooltip>
            
            {/* 应用标题 */}
            <h1 className="header-title">
              SiliconFlow Chat
            </h1>
          </div>
          
          <div className="header-actions">
            {/* 设置按钮 */}
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
      
      {/* 内容区域 */}
      <main className="main-content">
        {/* 左侧会话列表 */}
        {showChatList && (
          <ChatList />
        )}
        
        {/* 中间主聊天区域 */}
        <ChatMain />
        
        {/* 右侧设置面板 */}
        {showConfigPanel && (
          <ConfigPanel />
        )}
      </main>
    </div>
  );
};

export default App;