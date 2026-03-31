# Claude AI 项目指南

## 项目概述

SiliconFlow Chat 是一个基于 React 的类 OpenAI 聊天界面，采用 monorepo 架构，支持与 SiliconFlow 平台的 API 交互。

## 技术栈

### 前端 (packages/frontend)
- **框架**: React 19.2.0 + TypeScript 5.9.3
- **构建工具**: Vite (使用 rolldown-vite 7.2.5)
- **UI 库**: Ant Design 6.2.3
- **状态管理**: Zustand 5.0.11
- **Markdown**: react-markdown 10.1.0 + rehype-highlight 7.0.2
- **HTTP**: axios 1.13.4
- **代码高亮**: highlight.js 11.11.1

### 服务端 (packages/server)
- **框架**: Express.js 4.21.1
- **语言**: TypeScript 5.9.3
- **运行时**: tsx 4.19.2 (开发模式)
- **HTTP**: axios 1.13.4
- **中间件**: CORS 2.8.5, body-parser 1.20.3

### 开发工具
- **包管理器**: pnpm (workspace)
- **代码检查**: ESLint 9.39.1 + typescript-eslint 8.46.4
- **React 插件**: eslint-plugin-react-hooks 7.0.1, eslint-plugin-react-refresh 0.4.24

## 目录结构

```
/
├── packages/
│   ├── frontend/                    # 前端应用
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ChatInterface/   # 聊天界面组件
│   │   │   │   │   ├── ChatMain.tsx
│   │   │   │   │   ├── ChatList.tsx
│   │   │   │   │   ├── MessageItem.tsx
│   │   │   │   │   └── MessageInput.tsx
│   │   │   │   └── ConfigPanel/     # 配置面板组件
│   │   │   │       ├── index.tsx
│   │   │   │       ├── APIKeyInput.tsx
│   │   │   │       └── ModelConfig.tsx
│   │   │   ├── hooks/               # 自定义 hooks
│   │   │   │   ├── useChat.ts
│   │   │   │   └── useConfig.ts
│   │   │   ├── utils/               # 工具函数
│   │   │   │   ├── storage.ts       # 本地存储
│   │   │   │   └── api.ts           # API 请求
│   │   │   ├── types/               # 类型定义
│   │   │   │   └── index.ts
│   │   │   ├── App.tsx              # 主应用组件
│   │   │   ├── App.css              # 全局样式
│   │   │   ├── main.tsx             # 应用入口
│   │   │   └── index.tsx            # React 渲染
│   │   ├── public/                  # 静态资源
│   │   ├── eslint.config.js         # ESLint 配置
│   │   ├── tsconfig.json            # TypeScript 配置
│   │   ├── vite.config.ts           # Vite 配置
│   │   └── package.json             # 前端依赖
│   │
│   └── server/                      # 服务端应用
│       ├── src/
│       │   ├── routes/              # API 路由
│       │   │   ├── chat.ts          # 聊天接口
│       │   │   └── models.ts        # 模型接口
│       │   ├── services/            # 业务逻辑
│       │   │   └── siliconFlow.ts   # SiliconFlow 服务
│       │   ├── types/               # 类型定义
│       │   │   └── index.ts
│       │   └── index.ts             # 服务端入口
│       ├── dist/                    # 编译输出 (生成目录)
│       ├── tsconfig.json            # TypeScript 配置
│       └── package.json             # 服务端依赖
│
├── node_modules/                    # 依赖目录 (pnpm workspace)
├── pnpm-workspace.yaml              # Monorepo 配置
├── package.json                     # 根目录配置
├── .gitignore                       # Git 忽略配置
└── CLAUDE.md                        # 本文档
```

## 常用命令

### 开发
```bash
# 同时启动前端和服务端
pnpm dev

# 仅启动服务端 (端口 3001)
pnpm server

# 仅启动前端 (端口 5173)
pnpm frontend
```

### 构建
```bash
# 构建所有包
pnpm build

# 构建前端
pnpm --filter frontend build

# 构建服务端
pnpm --filter server build
```

### 代码检查
```bash
# 检查所有包
pnpm lint

# 检查前端
pnpm --filter frontend lint

# 检查服务端
pnpm --filter server lint
```

### 其他
```bash
# 安装依赖
pnpm install

# 预览生产构建
pnpm preview
```

## 代码规范

### TypeScript
- 使用 strict 模式
- 优先使用 TypeScript 类型定义，避免 `any`
- 接口和类型定义统一放在 `types/` 目录

### React
- 遵循 React Hooks 规则
- 组件按功能分组到对应的子目录
- 使用 ESLint + react-hooks-plugin 进行代码检查

### 命名规范
- 组件文件使用 PascalCase: `ChatMain.tsx`
- 工具函数文件使用 camelCase: `api.ts`
- 类型定义文件: `index.ts`

### 样式
- 优先使用 Ant Design 组件
- 全局样式放在 `App.css`
- 组件特定样式可使用 CSS Modules 或 styled-components

## 开发注意事项

### 端口配置
- 前端开发服务器: `http://localhost:5173` (Vite 默认)
- 服务端: `http://localhost:3001`
- API 代理: 前端 `/api/*` 请求会被代理到服务端

### 环境变量
- API Key 存储在 localStorage，不上传到服务器
- 模型参数 (temperature, max_tokens) 也存储在本地

### Git 忽略
- `node_modules/` - 依赖目录
- `dist/` - 构建输出
- `*.log` - 日志文件
- `.local` - 本地配置文件

## 禁止操作

1. **禁止提交敏感信息**
   - 绝对不要提交 API Key、密码等敏感信息
   - 不要提交 `.env` 文件

2. **禁止直接修改 node_modules**
   - 所有依赖通过 package.json 管理
   - 使用 pnpm 安装/更新依赖

3. **禁止忽略构建输出**
   - `dist/` 目录已在 `.gitignore` 中
   - 不要提交构建产物

4. **禁止跳过代码检查**
   - 提交前确保通过 `pnpm lint`
   - 修复所有 ESLint 错误和警告

5. **禁止使用 pnpm 以外的包管理器**
   - 项目使用 pnpm workspace
   - 不要混用 npm 或 yarn

6. **禁止破坏性操作**
   - 运行删除操作前确认目标
   - 避免在生产环境执行未测试的命令

## 架构说明

### Monorepo 结构
使用 pnpm workspace 管理，所有包共享 `node_modules`，减少依赖安装时间和磁盘占用。

### API 通信
- 前端通过 Vite proxy 将 `/api/*` 请求代理到服务端
- 服务端转发请求到 SiliconFlow API
- 支持流式响应 (SSE)

### 状态管理
- 使用 Zustand 管理全局状态
- 配置和会话数据持久化到 localStorage

## 常见问题

### Q: 为什么使用 rolldown-vite?
A: 项目使用 `rolldown-vite` 作为 Vite 的底层打包器，提供更快的构建速度。

### Q: 如何调试服务端?
A: 服务端使用 `tsx watch` 启动，支持热重载。可以添加 `console.log` 或使用 VS Code 调试器。

### Q: 如何添加新的 API 端点?
A: 在 `packages/server/src/routes/` 中创建新的路由文件，并在 `src/index.ts` 中注册。

## gstack

使用 gstack 的 `/browse` 技能进行所有网页浏览操作，不要使用 `mcp__claude-in-chrome__*` 工具。

可用技能：/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn。
