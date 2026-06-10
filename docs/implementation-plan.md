# 6mao 实施计划与完成情况

## 目标

基于 `docs/structure.md` 的要求，从当前仓库启动一个可运行的桌面猫咪宠物应用前端工程：

- 使用 Electron-Vite + React 19 + TypeScript + Tailwind CSS v4。
- 建立桌宠浮窗、聊天窗口、系统托盘、IPC、安全 preload 桥接。
- 同时预留精灵图与 Live2D 两套猫咪渲染路线。
- 对接后端宠物/聊天接口，支持 SSE 流式聊天。
- 使用 TanStack Query 管理服务端状态，使用 Zustand 持久化本地聊天历史。
- 使用 `VITE_API_BASE_URL` 配置后端地址，默认 `http://localhost:3000`。

## 实施计划

### Phase 1：基础框架

- 初始化 `package.json`、`electron.vite.config.ts`、TypeScript 配置、ESLint、Prettier。
- 安装 Electron、React、Tailwind、TanStack Query、Zustand、PixiJS、Live2D 相关依赖。
- 配置 `pnpm dev`、`pnpm build`、`pnpm typecheck`、`pnpm lint`、`pnpm dist`。

### Phase 2：窗口系统

- 主进程创建 `petWindow` 桌宠透明浮窗。
- 主进程创建 `chatWindow` 聊天面板窗口，并保持单例复用。
- 创建系统托盘，提供显示/隐藏猫咪、打开宠物列表、退出应用。
- 统一 IPC 通道，覆盖打开聊天、关闭聊天、鼠标穿透、宠物切换、情绪通知。
- preload 暴露 `window.electronAPI`，保持 renderer 与主进程安全通信。

### Phase 3：猫咪形象

- 实现 `CatSprite` 精灵图路线。
- 实现 `CatLive2D` Live2D 路线。
- 增加 `PetRenderer` 统一选择层，通过 `VITE_PET_RENDERER=sprite|live2d` 切换。
- 无真实资产时使用占位 SVG 猫咪，保证工程可运行。

### Phase 4：聊天核心

- 封装 API client，统一读取 `VITE_API_BASE_URL`。
- 实现宠物列表、状态、收养、普通聊天、SSE 流式聊天 API。
- 实现 `useStreamChat`，支持流式回复、打字机显示、错误状态、情绪通知。
- 使用 Zustand persist 保存每只宠物的本地聊天历史。

### Phase 5：宠物管理

- 实现聊天窗口主界面。
- 实现宠物列表页面。
- 实现收养页面。
- 实现状态面板，展示 bond、stats、soul 信息。
- 点击桌宠或托盘入口时打开对应聊天/列表视图。

### Phase 6：打磨与验证

- 补充占位托盘图标和占位猫咪资源。
- 补充 README 开发说明和环境变量说明。
- 配置 electron-builder 基础打包字段。
- 运行类型检查、lint、生产构建和开发启动探测。

## 完成情况

### 已完成

- 已建立 Electron-Vite 多入口工程。
- 已建立双窗口架构：
  - `petWindow`：透明、无边框、常驻桌面、跳过任务栏、鼠标穿透。
  - `chatWindow`：独立聊天窗口、单例复用、可隐藏关闭；应用启动时默认打开宠物列表页，避免只出现难以发现的桌宠小窗。
- 已建立系统托盘：
  - 显示/隐藏猫咪。
  - 打开宠物列表。
  - 退出应用。
- 已建立统一 IPC：
  - `window:open-chat`
  - `window:close-chat`
  - `window:set-ignore-mouse`
  - `pet:switch`
  - `pet:status-update`
  - `pet:emotion`
- 已建立 preload API：
  - `openChat(petId)`
  - `closeChat()`
  - `setIgnoreMouse(ignore)`
  - `onPetSwitch(callback)`
  - `notifyPetEmotion(emotion)`
  - `onPetEmotion(callback)`
- 已实现桌宠渲染：
  - 精灵图占位猫咪。
  - Live2D 动态加载入口。
  - Live2D 资源缺失时自动回退占位猫咪。
- 已实现聊天窗口：
  - 聊天页。
  - 宠物列表页。
  - 收养页。
  - 宠物状态面板。
- 已实现 API 层：
  - `getOwnerPets(ownerId)`
  - `adoptPet(payload)`
  - `getPetStatus(petId)`
  - `sendChat(petId, message)`
  - `streamChat(petId, message)`
- 已按 `docs/html/index.html` 原型里的真实后端契约完成对齐：
  - 收养请求使用 `{ owner_id, species, name, template }`。
  - 宠物列表解析 `{ pets: [...] }`。
  - 宠物 ID 使用 `pet_id`。
  - 状态解析 `bond.score`、`bond.stage`、`stats.mood`、`stats.energy`、`stats.boredom`、`soul_summary`。
  - 流式聊天请求使用 `{ owner_id, message }`，并支持 `event:` + `data:` 格式的 SSE 事件。
- 已配置开发代理：
  - 前端默认使用相对 `/api` 和 `/health`。
  - Vite dev server 将请求转发到 `VITE_DEV_API_PROXY_TARGET`，默认 `http://localhost:8000`。
- 已增加浏览器预览 fallback：
  - 直接打开 `http://localhost:5173/` 不再 404。
  - 直接打开 renderer 页面时，即使没有 Electron preload，也不会因 `window.electronAPI` 缺失导致空白页。
- 已增加开发用 mock backend：
  - `pnpm backend` 启动 `server/mock-backend.mjs`。
  - 当真实后端不可用时，可用于本地开发闭环。
- 已实现状态管理：
  - TanStack Query 获取宠物列表和状态。
  - Zustand persist 保存聊天历史。
- 已补充项目文档：
  - README 开发命令。
  - `.env.example` 环境变量示例。
- 已补充可运行占位资源：
  - `public/cats/placeholder-cat.svg`
  - `resources/tray-icon.svg`

### 验证结果

以下命令已通过：

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
```

`pnpm dev` 已做接口级启动探测：

```text
http://localhost:5173/health -> 200 {"status":"ok","version":"0.1.0"}
http://localhost:5173/api/owner/local-owner/pets -> 200 {"owner_id":"local-owner","pets":[]}
```

当前环境中检测到真实 Python 后端正在监听 `http://localhost:8000`，Vite 代理已能正确转发到该后端。

### 已处理的问题

- `pixi-live2d-display@^0.5.0` 在当前 npm 镜像无稳定版本，已调整为稳定版 `^0.4.0`。
- pnpm 默认跳过 Electron/esbuild 安装脚本，导致 Electron 二进制不可用；已在 `package.json` 增加 `pnpm.onlyBuiltDependencies` 并重新安装，`pnpm exec electron --version` 已可用。
- electron-vite 默认输出路径为 `out/main/index.js`，已修正 `package.json.main`。
- 开发模式多页面入口已修正为 `src/renderer/pet-window/index.html` 和 `src/renderer/chat-window/index.html`。
- preload 输出为 `index.mjs`，主进程窗口配置已改为加载该文件。
- 浏览器预览没有 Electron preload，导致页面空白；已加入 `electronApiFallback`。
- API 契约最初按计划文档做了简化，和 `docs/html/index.html` 不一致；已改为以后端原型代码为准。

## 尚未完成 / 后续事项

- 需要在真实后端上做完整人工验收：
  - 当前只验证了 `/health` 和宠物列表接口可达。
  - 收养流程、状态刷新、普通聊天、SSE 流式聊天还需要使用真实数据手动走通。
- 需要替换真实美术资产：
  - 精灵图资源。
  - Live2D 模型资源。
  - Windows `.ico` 托盘/应用图标。
- Live2D 当前是工程入口和回退机制，缺少真实模型资源时不会展示 Live2D 模型。
- 鼠标穿透已实现 Windows/Linux 优先路径，macOS 的无 `forward` 参数差异还需要实机专项处理。
- `pnpm dev` 已做 HTTP/代理探测，但尚未完成完整桌面窗口人工验收。
- electron-builder 已有基础配置，但还没有完成签名、图标、安装包细节和跨平台打包验证。

## 当前工程入口

- 主进程入口：`src/main/index.ts`
- 桌宠窗口：`src/renderer/pet-window`
- 聊天窗口：`src/renderer/chat-window`
- IPC 常量：`src/shared/ipc-channels.ts`
- preload API：`src/preload/index.ts`
- API client：`src/renderer/chat-window/src/api`
- 聊天历史 store：`src/renderer/chat-window/src/store/chatHistory.ts`
