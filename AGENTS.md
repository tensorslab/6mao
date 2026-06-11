## 参考文档

- `docs/structure.md` — 完整架构设计、窗口系统、猫咪渲染方案、后端接口契约、目录结构、跨平台注意事项
- `docs/html/index.html` — 后端 API 与聊天 UI 的原型参考（含 SSE 流式、思考块、工具调用可视化）

## 常用命令

```bash
pnpm typecheck ; pnpm lint ; pnpm format #powershell format
```
修改代码后，需要执行上述命令

## 架构概览

Electron 三进程模型（electron-vite 构建）：

- **Main** `src/main/` — 应用生命周期、窗口/托盘创建、daemon 管理、WebSocket 桥接 Python 后端
- **Preload** `src/preload/` — contextBridge 暴露 `window.electronAPI`
- **Renderer** — 两个独立 HTML 入口：
  - **Pet 浮窗** `src/renderer/pet-window/` — 150×92 透明置顶猫咪（sprite 或 Live2D）
  - **Chat 窗口** `src/renderer/chat-window/` — 560×780 无边框聊天、宠物列表、领养、状态面板

核心子系统：daemon 管理器（`src/main/daemon/`）、WebSocket 桥接（`desktop-ws.ts`）、IPC 通道定义（`src/shared/ipc-channels.ts`）、REST + SSE 流式 API（`src/renderer/chat-window/api/`）。

状态管理：Zustand（本地聊天历史、当前宠物 ID）+ TanStack React Query（服务端宠物数据）。

路径别名：`@shared/*` → `src/shared/*`、`@chat/*` → `src/renderer/chat-window/src/*`、`@pet/*` → `src/renderer/pet-window/src/*`。

## 环境变量

| 变量                        | 说明                                       |
| --------------------------- | ------------------------------------------ |
| `VITE_DEV_API_PROXY_TARGET` | 开发代理目标，默认 `http://localhost:8000` |
| `VITE_API_BASE_URL`         | 生产环境后端地址                           |
| `VITE_OWNER_ID`             | 默认 owner ID（`local-owner`）             |
| `VITE_PET_RENDERER`         | 猫咪渲染：`sprite` 或 `live2d`             |
| `MIAO_DAEMON_COMMAND`       | 若设置，主进程自动启动该命令作为 daemon    |

## 代码风格

Prettier：单引号、无分号、无尾逗号、100 字符宽度。UI 文本和注释为中文，代码标识符为英文。TypeScript strict 模式。