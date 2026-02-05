// 应用主组件
import React, { useState } from 'react';
import { Layout, Button, Tooltip } from 'antd';
import { MenuOutlined, SettingOutlined, MenuFoldOutlined } from '@ant-design/icons';
import ChatList from './components/ChatInterface/ChatList';
import ChatMain from './components/ChatInterface/ChatMain';
import ConfigPanel from './components/ConfigPanel';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [showChatList, setShowChatList] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 头部 */}
      <Header 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* 菜单切换按钮 */}
          <Tooltip title={showChatList ? '隐藏会话列表' : '显示会话列表'}>
            <Button
              type="text"
              icon={showChatList ? <MenuFoldOutlined /> : <MenuOutlined />}
              onClick={() => setShowChatList(!showChatList)}
              style={{ fontSize: '16px' }}
            />
          </Tooltip>
          
          {/* 应用标题 */}
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
            SiliconFlow Chat
          </h1>
        </div>
        
        <div>
          {/* 设置按钮 */}
          <Tooltip title={showConfigPanel ? '隐藏设置' : '显示设置'}>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              style={{ fontSize: '16px' }}
            />
          </Tooltip>
        </div>
      </Header>
      
      {/* 内容区域 */}
      <Content style={{ display: 'flex', overflow: 'hidden' }}>
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
      </Content>
    </Layout>
  );
};

export default App;