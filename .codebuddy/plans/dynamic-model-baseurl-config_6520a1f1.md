---
name: dynamic-model-baseurl-config
overview: 将当前仅支持阿里云 DashScope 的固定上游模型地址，改为用户可在前端动态配置 `baseUrl`，并透传到后端用于请求不同 OpenAI 兼容模型服务（如智谱、Kimi），同时保留现有阿里云默认值。
todos:
  - id: review-impact
    content: 使用[subagent:code-explorer]复核baseUrl链路与影响面
    status: completed
  - id: extend-config-state
    content: 扩展前端类型、存储与useConfig，持久化baseUrl
    status: completed
    dependencies:
      - review-impact
  - id: upgrade-config-ui
    content: 改造设置面板，新增Base URL并支持手动模型名
    status: completed
    dependencies:
      - extend-config-state
  - id: pass-baseurl-from-frontend
    content: 调整api.ts与useChat，统一透传X-Model-Base-Url
    status: completed
    dependencies:
      - extend-config-state
  - id: dynamic-upstream-routing
    content: 修改后端路由与服务，动态校验并转发上游地址
    status: completed
    dependencies:
      - pass-baseurl-from-frontend
  - id: polish-copy-and-regression
    content: 更新通用文案并验证默认回退与异常场景
    status: completed
    dependencies:
      - upgrade-config-ui
      - dynamic-upstream-routing
---

## 用户需求

- 现有项目只能通过固定的阿里云上游地址使用模型服务，需要改为可动态配置模型服务的 `baseUrl`。
- 用户希望在同一套聊天界面中，自行填写 `apiKey`、`baseUrl` 和模型信息，以接入不同厂商的兼容模型服务，例如智谱、Kimi 等。

## 产品概述

- 保持当前“前端配置 + 后端代理转发”的使用方式不变，在设置面板中新增通用连接配置。
- 用户保存配置后，聊天请求和模型列表请求都应使用该 `baseUrl`；未填写时继续使用当前默认阿里云地址。
- 界面视觉上是在现有设置弹窗中新增一个 Base URL 输入项，并将“仅支持阿里云”的提示文案改为通用模型服务描述，整体布局和交互风格保持不变。

## 核心功能

- 在设置面板中新增并保存 `baseUrl`，与 `apiKey` 一起作为连接配置长期保存在本地。
- 聊天请求、流式请求、模型列表请求统一透传 `baseUrl` 到后端，由后端按该地址调用上游模型接口。
- 未填写 `baseUrl` 时继续兼容当前阿里云默认地址；填写非法地址时给出明确提示。
- 模型选择改为更通用的方式：优先使用接口返回的模型列表，获取失败时仍可继续配置模型名，避免被单一厂商限制。

## 技术栈选择

- 前端：React + TypeScript + Vite
- 状态管理：Zustand（已在 `packages/frontend/src/hooks/useConfig.ts` 使用）
- UI 组件：Ant Design（已在配置面板组件中使用）
- 网络请求：Axios + Fetch（已在 `packages/frontend/src/utils/api.ts` 使用）
- 后端：Node.js + Express + TypeScript
- 上游模型调用：服务端通过 Axios 以 OpenAI 兼容接口方式转发请求

## 实现方案

### 实现策略

在现有“前端存配置、后端做代理”的链路上新增一个通用 `baseUrl` 配置项，前端通过自定义请求头把上游地址传给后端，后端在调用模型服务时动态覆盖默认上游地址。这样可以复用现有接口与数据流，避免引入新的 provider 枚举或重写聊天协议。

### 关键决策

- **不新增 provider 枚举**：当前代码没有 provider 抽象，直接以 `baseUrl + apiKey + model` 作为最小可用配置，更贴合用户需求，也能减少状态和分支复杂度。
- **使用自定义请求头透传 `baseUrl`**：建议统一使用如 `X-Model-Base-Url` 传递给后端，原因是：
- 不污染现有 OpenAI 风格请求体；
- `GET /models` 与 `POST /chat/completions` 都能复用同一传参方式；
- 可避免修改服务端 `ChatRequest` 结构，降低回归风险。
- **保留阿里云默认值兜底**：当 `baseUrl` 为空时继续走 `https://dashscope.aliyuncs.com/compatible-mode/v1`，保证老用户配置不失效。
- **不重命名 `siliconFlow.ts`**：虽然命名已不准确，但本次优先限制影响面，先泛化其内部逻辑与注释，避免无收益的大范围重构。
- **增强模型配置的兼容性**：不同厂商不一定都稳定支持 `/models`，因此模型配置应支持“接口列表优先 + 手动输入兜底”，否则仅改 `baseUrl` 仍不足以真正接入多厂商模型。

### 性能与可靠性

- 配置保存与模型列表刷新应仅在用户点击保存后触发，避免输入过程中反复请求，额外开销为常数级。
- 流式消息处理逻辑保持现状，整体仍是按数据块线性处理，时间复杂度为 O(n)。
- 主要性能瓶颈仍在上游模型接口延迟，本次新增的只是一次请求头读取和 URL 规范化，影响可忽略。
- 需增加前后端双重校验：
- 前端校验 URL 基本格式；
- 后端再次校验协议与地址合法性，避免非法地址直接进入代理逻辑。
- 若项目会部署到公网，动态 `baseUrl` 会引入 SSRF 风险，后端至少应限制为 `http/https`，并拒绝 `localhost`、回环地址及明显内网地址。

## 实施要点

- 复用 `useConfig` 与 `storage.ts` 的现有持久化模式，不额外引入新状态库。
- `baseUrl` 保存时做标准化：去首尾空格、去末尾 `/`，允许用户填写完整版本路径（如 `/v1`）。
- `packages/frontend/src/utils/api.ts` 中聊天、流式、模型列表请求都要统一附带 `X-Model-Base-Url`。
- `packages/server/src/routes/chat.ts` 与 `packages/server/src/routes/models.ts` 都要从请求头读取 `baseUrl` 并传给服务层。
- `packages/server/src/services/siliconFlow.ts` 负责最终兜底、标准化与发请求，不要在多个后端文件重复拼接上游地址。
- 日志继续沿用当前“掩码 API Key”的方式，不记录完整密钥；`baseUrl` 日志应避免带 query/hash，防止泄露敏感参数。
- 将阿里云专属文案改为通用描述，避免用户误以为只能接阿里云。

## 架构设计

### 数据流

- 设置面板输入 `apiKey/baseUrl`  
→ `useConfig` 更新并持久化
→ `utils/api.ts` 发起前端到本项目后端的请求
→ 请求头携带 `X-Model-Base-Url`
→ Express 路由读取并传递
→ `siliconFlow.ts` 按动态上游地址请求 `/chat/completions` 或 `/models`

### 模块关系

- 前端配置模块负责采集、校验、保存和展示连接信息。
- 前端 API 模块负责统一透传认证与上游地址。
- 后端路由负责解析请求并做输入校验。
- 后端服务层负责上游地址解析、默认值回退和实际 HTTP 转发。

## 目录结构

### 变更概览

本次改动以“扩展现有配置链路”为主，不新增复杂模块，优先在已有文件中完成闭环。

- `d:/code/test/skills-test/packages/frontend/src/types/index.ts` `[MODIFY]`  
目的：扩展前端配置类型。
功能：为 `UserConfig` 增加 `baseUrl` 字段；必要时补充模型输入的通用类型约束。
要求：保持现有类型兼容，不影响消息与会话结构。

- `d:/code/test/skills-test/packages/frontend/src/hooks/useConfig.ts` `[MODIFY]`  
目的：扩展前端配置状态中心。
功能：加载、保存、重置 `baseUrl`；联动模型列表刷新；移除 Qwen 绑定式默认行为。
要求：避免保存时重复触发多次模型拉取；未配置时可安全回退默认上游。

- `d:/code/test/skills-test/packages/frontend/src/utils/storage.ts` `[MODIFY]`  
目的：持久化用户连接配置。
功能：存取包含 `baseUrl` 的 `userConfig`。
要求：兼容旧存储结构，避免老用户本地数据读取报错。

- `d:/code/test/skills-test/packages/frontend/src/utils/api.ts` `[MODIFY]`  
目的：统一透传动态上游地址。
功能：聊天、流式、模型列表请求统一附加 `X-Model-Base-Url`。
要求：不改变前端访问本项目后端的 `API_BASE_URL` 逻辑；错误处理保持现有模式。

- `d:/code/test/skills-test/packages/frontend/src/hooks/useChat.ts` `[MODIFY]`  
目的：补齐聊天调用参数链路。
功能：把当前保存的 `baseUrl` 传入流式聊天请求。
要求：不改动现有消息流更新逻辑，避免影响会话和流式中断行为。

- `d:/code/test/skills-test/packages/frontend/src/components/ConfigPanel/APIKeyInput.tsx` `[MODIFY]`  
目的：扩展设置表单。
功能：新增 Base URL 输入项，与 API Key 一起保存/清除/校验。
要求：保持当前交互风格；文案改为通用模型服务，不再限定阿里云。

- `d:/code/test/skills-test/packages/frontend/src/components/ConfigPanel/ModelConfig.tsx` `[MODIFY]`  
目的：提升多厂商模型兼容性。
功能：模型列表按动态 `baseUrl + apiKey` 拉取；拉取失败时允许手动输入模型名。
要求：避免强绑定 Qwen/GPT 默认列表；保持温度和最大输出参数逻辑不变。

- `d:/code/test/skills-test/packages/frontend/src/components/ConfigPanel/index.tsx` `[MODIFY]`  
目的：更新配置面板说明文案。
功能：将“阿里云百炼”描述替换为通用 OpenAI 兼容模型服务说明。
要求：不调整整体布局结构。

- `d:/code/test/skills-test/packages/frontend/src/components/ChatInterface/ChatMain.tsx` `[MODIFY]`  
目的：统一空状态提示。
功能：将“请输入阿里云百炼 API Key”改为通用 `API Key / Base URL` 提示。
要求：仅修改提示，不影响消息区和输入框行为。

- `d:/code/test/skills-test/packages/server/src/routes/chat.ts` `[MODIFY]`  
目的：接收动态上游地址。
功能：读取请求头中的 `X-Model-Base-Url` 并传给服务层。
要求：保留现有聊天与流式响应接口格式；错误码与响应结构保持兼容。

- `d:/code/test/skills-test/packages/server/src/routes/models.ts` `[MODIFY]`  
目的：让模型列表也走动态上游。
功能：读取请求头中的 `X-Model-Base-Url` 并传给服务层；将 `owned_by` 改为通用值。
要求：避免继续写死 `qwen`，防止错误展示厂商信息。

- `d:/code/test/skills-test/packages/server/src/services/siliconFlow.ts` `[MODIFY]`  
目的：泛化固定阿里云服务实现。
功能：将写死的 `API_BASE_URL` 改为“默认值 + 动态覆盖”；统一 URL 标准化、校验与请求实例创建。
要求：继续兼容当前 DashScope 默认地址；避免把非法地址传给 Axios。

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 复核 `baseUrl` 从设置面板到后端服务层的完整传递链路，确认所有调用点和文案影响面。
- Expected outcome: 产出准确的受影响文件清单、调用关系和回归边界，确保实现不遗漏聊天、模型列表和本地存储链路。