# 6mao

桌面猫咪宠物应用，基于 Electron-Vite + React 19 + TypeScript + Tailwind CSS v4。

## 开发

```bash
pnpm install
pnpm dev
```

如果没有单独启动真实后端，可以先开一个开发用 mock 后端：

```bash
pnpm backend
```

真实后端或 mock 后端默认监听 `http://localhost:8000`，再另开一个终端运行 `pnpm dev`。

浏览器预览地址：

```text
http://localhost:5173/
```

根地址会自动跳转到聊天窗口；真实聊天页面地址是：

```text
http://localhost:5173/chat-window/index.html
```

## 环境变量

复制 `.env.example` 为 `.env.local` 后按需调整：

```bash
VITE_API_BASE_URL=
VITE_DEV_API_PROXY_TARGET=http://localhost:8000
VITE_OWNER_ID=local-owner
VITE_PET_RENDERER=sprite
```

开发模式默认使用 Vite 代理把 `/api` 和 `/health` 转发到 `VITE_DEV_API_PROXY_TARGET`。开发模式会强制走同源代理，避免浏览器 CORS；打包/生产模式如果需要直连后端，再设置 `VITE_API_BASE_URL`。

`VITE_PET_RENDERER` 可设置为 `sprite` 或 `live2d`。没有真实 Live2D 资源时会自动显示占位猫咪。

## 常用命令

```bash
pnpm dev          # electron-vite 开发服务器（HMR，含全部 3 个进程）
pnpm backend      # 启动 mock 后端 :8000（Node.js，无需 Python）
pnpm build        # typecheck + electron-vite 构建
pnpm typecheck    # tsc --noEmit（renderer + node 两份 tsconfig）
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm dist         # 打包
```
