# 6mao

桌面猫咪宠物应用，基于 Electron-Vite + React 19 + TypeScript + Tailwind CSS v4。

## 开发

```bash
pnpm install
pnpm dev
```

## 环境变量

复制 `.env.example` 为 `.env.local` 后按需调整：

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_OWNER_ID=local-owner
VITE_PET_RENDERER=sprite
```

`VITE_PET_RENDERER` 可设置为 `sprite` 或 `live2d`。没有真实 Live2D 资源时会自动显示占位猫咪。

## 常用命令

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm dist
```
