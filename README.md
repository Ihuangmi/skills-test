# SiliconFlow Chat

基于React的类OpenAI聊天界面，支持与SiliconFlow平台的API交互。采用monorepo架构，包含前端和本地服务端。

## 功能特性

### 1. 用户配置模块

- **API Key管理**：支持输入和保存API Key到本地存储，避免重复填写
- **模型配置**：支持选择SiliconFlow平台的模型
- **参数调整**：可设置temperature（0-2）和max_tokens（1-4096）参数

### 2. 对话交互界面

- **双栏布局**：左侧历史会话列表，右侧主聊天区
- **多轮对话**：支持保留上下文，通过messages数组传递历史记录
- **流式响应**：实现逐字输出效果，使用Server-Sent Events

### 3. 功能增强

- **Markdown渲染**：支持代码高亮、链接解析等
- **一键复制**：每条消息支持一键复制回复内容
- **响应统计**：显示响应耗时和token用量

### 4. 错误处理与状态管理

- **异常提示**：网络错误、API限流等异常提示
- **加载状态**：发送中、流式响应时的加载动画

### 5. 技术栈

#### 前端

- **前端框架**：React 18 + TypeScript
- **UI库**：Ant Design
- **状态管理**：Zustand
- **Markdown渲染**：react-markdown + rehype-highlight
- **HTTP客户端**：axios

#### 服务端

- **服务端框架**：Express.js
- **语言**：TypeScript
- **HTTP客户端**：axios
- **中间件**：CORS、body-parser

#### 项目管理

- **包管理器**：pnpm
- **Monorepo工具**：pnpm workspace
- **构建工具**：Vite (前端)、tsc (服务端)

## 快速开始

### 环境要求

- Node.js 16.x 或更高版本
- pnpm 7.x 或更高版本

### 安装步骤

1. **克隆项目**

   ```bash
   git clone <repository-url>
   cd skills-test
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **启动开发服务器**

   #### 方式1：同时启动前端和服务端

   ```bash
   pnpm dev
   ```

   #### 方式2：单独启动服务端

   ```bash
   pnpm server
   ```

   #### 方式3：单独启动前端

   ```bash
   pnpm frontend
   ```

4. **访问应用**
   - 前端：`http://localhost:5173` (或其他可用端口)
   - 服务端：`http://localhost:3001`
   - 服务端健康检查：`http://localhost:3001/health`

5. **构建项目**

   #### 构建生产版本

   ```bash
   pnpm build
   ```

   #### 预览构建结果

   ```bash
   pnpm preview
   ```

## 使用指南

### 1. 设置API Key

- 点击右上角的设置图标
- 在API Key输入框中输入您的SiliconFlow API Key
- 点击保存按钮

### 2. 配置模型参数

- 在设置面板中选择合适的模型
- 调整temperature值（控制输出随机性）
- 调整max_tokens值（控制最大输出长度）

### 3. 开始聊天

- 在左侧会话列表中点击新建会话按钮
- 在右侧输入框中输入您的问题
- 按Enter键或点击发送按钮
- 查看助手的流式响应

### 4. 管理会话

- **新建会话**：点击左侧会话列表顶部的加号按钮
- **切换会话**：点击左侧会话列表中的会话项
- **删除会话**：点击会话项右侧的删除按钮

## 项目结构

```
/
├── packages/
│   ├── frontend/           # 前端代码
│   │   ├── src/
│   │   │   ├── components/   # 组件
│   │   │   ├── hooks/        # 自定义钩子
│   │   │   ├── utils/        # 工具函数
│   │   │   ├── types/        # TypeScript类型定义
│   │   │   ├── App.tsx       # 应用主组件
│   │   │   ├── index.tsx     # 应用入口
│   │   │   └── index.css     # 全局样式
│   │   ├── public/         # 静态资源
│   │   ├── package.json    # 前端配置
│   │   └── vite.config.ts  # Vite配置
│   ├── server/             # 服务端代码
│   │   ├── src/
│   │   │   ├── routes/      # API路由
│   │   │   ├── services/    # 服务层
│   │   │   ├── types/       # TypeScript类型定义
│   │   │   └── index.ts     # 服务端入口
│   │   ├── package.json    # 服务端配置
│   │   └── tsconfig.json   # TypeScript配置
├── pnpm-workspace.yaml    # Monorepo配置
├── package.json           # 根目录配置
├── README.md              # 项目说明
└── .gitignore             # Git忽略文件
```

## 响应式设计

- **桌面端**：双栏布局，左侧会话列表，右侧聊天区域
- **移动端**：单栏布局，会话列表可折叠，设置面板全屏显示

## 性能优化

1. **消息渲染优化**：使用React.memo避免不必要的重渲染
2. **虚拟滚动**：长消息列表使用虚拟滚动
3. **缓存策略**：缓存会话数据减少API调用
4. **代码分割**：按需加载组件

## 安全考虑

1. **API Key保护**：API Key仅保存在本地存储，不会上传到服务器
2. **输入验证**：防止恶意输入和XSS攻击
3. **错误处理**：不向用户暴露敏感错误信息

## 常见问题

### 1. API Key在哪里获取？

- 登录SiliconFlow平台，在个人中心获取API Key

### 2. 为什么没有收到响应？

- 检查API Key是否正确
- 检查网络连接是否正常
- 检查模型是否支持流式响应

### 3. 如何清空所有会话？

- 逐个删除会话列表中的会话

### 4. 如何切换到不同的模型？

- 在设置面板中选择不同的模型

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎联系我们。
