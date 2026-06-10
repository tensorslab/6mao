# 6mao# 桌面猫咪宠物应用 — 项目参考文档

> 技术栈：Electron-Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui  
> 后端接口已就绪，本文档专注前端架构与实现细节

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈选型理由](#2-技术栈选型理由)
3. [架构设计](#3-架构设计)
4. [窗口系统设计](#4-窗口系统设计)
5. [猫咪形象方案](#5-猫咪形象方案)
6. [后端接口对接](#6-后端接口对接)
7. [目录结构](#7-目录结构)
8. [核心模块实现要点](#8-核心模块实现要点)
9. [跨平台注意事项](#9-跨平台注意事项)
10. [Agent 编程建议](#10-agent-编程建议)
11. [开发路线图](#11-开发路线图)

---

## 1. 项目概述

### 功能需求

| 功能 | 说明 | 接口 |
|---|---|---|
| 宠物收养 | 从列表中选择并领养猫咪 | `POST /api/adopt` |
| 宠物列表 | 展示所有已领养猫咪 | `GET /api/owner/{id}/pets` |
| 聊天（阻塞） | 普通请求-响应聊天 | `POST /api/pet/{id}/chat` |
| 聊天（流式） | SSE 流式回复，打字机效果 | `POST /api/pet/{id}/chat/stream` |
| 宠物状态 | 展示羁绊值、属性、灵魂状态 | `GET /api/pet/{id}/status` |
| 聊天历史 | 本地持久化，跨会话保留 | 本地 SQLite / localStorage |
| 桌面浮窗 | 启动后猫咪悬浮在桌面上 | — |
| 点击唤起 | 点击猫咪弹出聊天面板 | — |

### 产品交互流程

```
启动应用
  └─ 系统托盘图标出现
  └─ 猫咪浮窗出现（右下角，透明背景，常驻桌面）
       └─ 猫咪播放 idle 动画（随性格不同）
       └─ 用户点击猫咪
            └─ 聊天面板弹出（独立窗口，左侧或底部）
                 ├─ 展示宠物状态（bond/stats/soul）
                 ├─ 展示聊天历史
                 └─ 输入框 → 流式 SSE 回复
```

---

## 2. 技术栈选型理由

### 为什么不裁剪 DeepChat

DeepChat (ThinkInAIXYZ/deepchat) 是基于 Vue + Electron 的通用 AI 客户端，架构上为多 LLM 供应商接入设计：

- 核心通信链路：`Renderer → IPC → Presenter → LLM SDK`，需要完全重写才能改为 HTTP 调用
- 实现了 MCP、知识库、多 Tab、ACP 协议等与本项目无关的 80% 功能
- Vue 3 生态对 AI agent 编程友好度低于 React（训练数据偏差）
- 裁剪估时 ~2 周，新写 agent 辅助下 3-5 天

### 最终技术栈

| 层次 | 技术 | 版本 | 选型理由 |
|---|---|---|---|
| 桌面框架 | Electron | 40+ | 透明窗口、常驻桌面、系统托盘原生支持 |
| 构建工具 | electron-vite | latest | 官方推荐，HMR 极快，主/渲进程统一配置 |
| UI 框架 | React | 19 | Agent 编程支持最佳，生态最大 |
| 语言 | TypeScript | 5 | 类型安全，接口类型自动推导 |
| 样式 | Tailwind CSS | v4 | 无需配置，utility-first |
| 组件库 | shadcn/ui | latest | 可复制粘贴，不引入 npm 依赖，完全可控 |
| 数据请求 | TanStack Query | v5 | SSE 原生支持，缓存管理 |
| 路由 | TanStack Router | v1 | 类型安全路由，适合 SPA |
| 状态管理 | Zustand | v5 | 极简，无 boilerplate |
| 动画渲染 | PixiJS + pixi-live2d-display | latest | Live2D 模型渲染 |
| 本地存储 | electron-store | v10 | 配置持久化 |

---

## 3. 架构设计

### Electron 多进程架构

```
┌─────────────────────────────────────────────┐
│              Main Process (Node.js)          │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │petWindow │  │chatWindow│  │  Tray    │  │
│  │ 浮动猫咪  │  │ 聊天面板  │  │ 系统托盘  │  │
│  └────┬─────┘  └────┬─────┘  └──────────┘  │
│       │IPC          │IPC                    │
└───────┼─────────────┼───────────────────────┘
        │             │
  ┌─────▼─────┐ ┌─────▼──────────────────────┐
  │ Pet Window│ │       Chat Window           │
  │ Renderer  │ │       Renderer              │
  │           │ │                             │
  │ PixiJS    │ │  React + shadcn/ui          │
  │ Live2D    │ │  TanStack Query             │
  │ 猫咪动画   │ │  SSE 聊天 / 状态 / 历史     │
  └───────────┘ └─────────────────────────────┘
```

### IPC 通信约定

所有 IPC 通道名称使用 `domain:action` 格式：

```typescript
// 窗口控制
'window:open-chat'        // 猫咪被点击，通知主进程弹出聊天窗口
'window:close-chat'       // 关闭聊天窗口
'window:set-ignore-mouse' // 动态控制鼠标穿透

// 宠物数据（renderer → main → 后端 or 直接 renderer → 后端）
'pet:switch'              // 切换当前显示的猫咪
'pet:status-update'       // 状态变化通知
```

> **注意**：HTTP 请求直接在 renderer 发起即可（fetch / EventSource），不必经过 main 进程中转，除非有 CORS 限制。

---

## 4. 窗口系统设计

### 4.1 浮动宠物窗口（petWindow）

```typescript
// src/main/windows/petWindow.ts
const petWindow = new BrowserWindow({
  width: 200,
  height: 200,
  transparent: true,       // 透明背景
  frame: false,            // 无边框
  resizable: false,
  hasShadow: false,
  skipTaskbar: true,       // 不在任务栏显示
  alwaysOnTop: true,
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    contextIsolation: true,
  },
})

petWindow.setAlwaysOnTop(true, 'floating')
petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
petWindow.setIgnoreMouseEvents(true, { forward: true }) // 初始穿透
```

### 4.2 鼠标穿透动态切换（关键实现）

空白处穿透、猫咪形体可点击：

```typescript
// src/preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouse: (ignore: boolean) =>
    ipcRenderer.send('window:set-ignore-mouse', ignore),
  openChat: (petId: string) =>
    ipcRenderer.send('window:open-chat', { petId }),
})

// src/renderer/pet-window/App.tsx
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const onCat = el?.closest('#cat-sprite') !== null
    window.electronAPI.setIgnoreMouse(!onCat)
  }
  window.addEventListener('mousemove', handleMouseMove)
  return () => window.removeEventListener('mousemove', handleMouseMove)
}, [])
```

**平台差异处理**：

| 平台 | forward 参数 | 备注 |
|---|---|---|
| Windows | 支持 | 有拖动时 flicker bug，用 requestAnimationFrame 轮询缓解 |
| macOS | 不支持 | 改用 `iohook` 或定时轮询鼠标坐标判断 |
| Linux | 支持 | 基本与 Windows 相同 |

### 4.3 聊天窗口（chatWindow）

```typescript
// src/main/windows/chatWindow.ts
let chatWindow: BrowserWindow | null = null

export function openChatWindow(petId: string) {
  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.focus()
    chatWindow.webContents.send('pet:switch', petId)
    return
  }

  chatWindow = new BrowserWindow({
    width: 400,
    height: 650,
    frame: false,
    titleBarStyle: 'hidden',  // macOS 原生流量灯
    vibrancy: 'under-window', // macOS 毛玻璃效果
    backgroundMaterial: 'acrylic', // Windows 11 Mica
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
    },
  })
}
```

### 4.4 系统托盘

```typescript
const tray = new Tray(nativeImage.createFromPath(trayIconPath))
const contextMenu = Menu.buildFromTemplate([
  { label: '显示猫咪', click: () => petWindow.show() },
  { label: '宠物列表', click: () => openChatWindow('list') },
  { type: 'separator' },
  { label: '退出', click: () => app.quit() },
])
tray.setContextMenu(contextMenu)
tray.on('click', () => petWindow.isVisible() ? petWindow.hide() : petWindow.show())
```

---

## 5. 猫咪形象方案

### 方案 A：精灵图动画（推荐优先实现）

适合有像素风美术资产的情况，实现简单，性能优秀：

```typescript
// 每种性格对应一套精灵图
const PERSONALITY_SPRITES: Record<string, SpriteConfig> = {
  tsundere: { src: '/cats/tsundere.png', frames: 8, fps: 8, idleRow: 0, talkRow: 1 },
  genki:    { src: '/cats/genki.png',    frames: 8, fps: 12, idleRow: 0, talkRow: 1 },
  sleepy:   { src: '/cats/sleepy.png',   frames: 6, fps: 5,  idleRow: 0, talkRow: 1 },
  cool:     { src: '/cats/cool.png',     frames: 8, fps: 8,  idleRow: 0, talkRow: 1 },
}
```

### 方案 B：Live2D 模型（更高质量）

使用 `pixi-live2d-display` + PixiJS，支持 Cubism 4 模型：

```typescript
import { Application } from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display'

// 注册 Cubism 核心
Live2DModel.registerTicker(PIXI.Ticker)

const app = new Application({ transparent: true, backgroundAlpha: 0 })
document.getElementById('cat-sprite')!.appendChild(app.view)

const model = await Live2DModel.from('/models/tsundere/tsundere.model3.json')
app.stage.addChild(model)

// 性格对应不同 motion
model.motion('idle')       // 空闲
model.motion('talk')       // 说话中
model.motion('happy')      // 收到喜欢的回复
model.motion('sad')        // 被冷落
```

**参考项目**：`liwenka1/bongo-cat-next` — 已实现透明窗口 + Live2D 猫咪 + 鼠标交互。

### 性格系统

```typescript
// src/renderer/pet-window/types.ts
export type Personality = 'tsundere' | 'genki' | 'sleepy' | 'cool' | 'gentle'

export interface PetPersonalityConfig {
  id: Personality
  displayName: string
  modelPath: string          // Live2D 模型路径
  spritePath: string         // 精灵图路径（备用）
  idleMotion: string         // 空闲动画
  talkMotion: string         // 说话动画
  idleInterval: number       // 随机动作触发间隔 ms
  color: string              // UI 主题色（聊天窗口）
}
```

---

## 6. 后端接口对接

### 接口清单

```
POST   /api/adopt              领养新宠物
POST   /api/pet/{id}/chat      聊天（阻塞）
POST   /api/pet/{id}/chat/stream  聊天（SSE 流式）
GET    /api/pet/{id}/status    获取宠物状态（bond/stats/soul）
GET    /api/owner/{id}/pets    获取所有宠物列表
GET    /health                 健康检查
```

### TypeScript 类型定义

```typescript
// src/renderer/api/types.ts

export interface Pet {
  id: string
  name: string
  personality: Personality
  adoptedAt: string
  ownerId: string
}

export interface PetStatus {
  bond: number           // 羁绊值 0-100
  stats: {
    hunger: number
    happiness: number
    energy: number
    cleanliness: number
  }
  soul: {
    mood: string         // 当前心情描述
    trait: string        // 当前突出性格特征
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AdoptRequest {
  ownerId: string
  petTemplateId: string  // 从列表选择的宠物模板
  name: string           // 用户给猫咪起的名字
}
```

### SSE 流式聊天实现

```typescript
// src/renderer/api/chat.ts
export async function* streamChat(petId: string, message: string) {
  const response = await fetch(`/api/pet/${petId}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    // 解析 SSE data: 行
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          yield parsed.content ?? parsed.delta ?? data
        } catch {
          yield data
        }
      }
    }
  }
}
```

### TanStack Query 集成

```typescript
// src/renderer/hooks/usePetStatus.ts
export function usePetStatus(petId: string) {
  return useQuery({
    queryKey: ['pet-status', petId],
    queryFn: () => fetch(`/api/pet/${petId}/status`).then(r => r.json()),
    refetchInterval: 30_000,  // 每 30 秒刷新状态
    staleTime: 10_000,
  })
}

// src/renderer/hooks/useOwnerPets.ts
export function useOwnerPets(ownerId: string) {
  return useQuery({
    queryKey: ['owner-pets', ownerId],
    queryFn: () => fetch(`/api/owner/${ownerId}/pets`).then(r => r.json()),
  })
}
```

### 聊天历史本地持久化

聊天历史存储在本地（不依赖后端），使用 `electron-store` 或 `localStorage`：

```typescript
// src/renderer/store/chatHistory.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChatStore {
  histories: Record<string, ChatMessage[]>  // petId → messages
  addMessage: (petId: string, msg: ChatMessage) => void
  clearHistory: (petId: string) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      histories: {},
      addMessage: (petId, msg) =>
        set(state => ({
          histories: {
            ...state.histories,
            [petId]: [...(state.histories[petId] ?? []), msg],
          },
        })),
      clearHistory: (petId) =>
        set(state => ({
          histories: { ...state.histories, [petId]: [] },
        })),
    }),
    { name: 'cat-chat-history' }
  )
)
```

---

## 7. 目录结构

```
6mao/
├── electron.vite.config.ts          # electron-vite 主配置
├── package.json
├── tsconfig.json
├── tsconfig.node.json
│
├── resources/                        # 打包资源
│   ├── icon.png
│   ├── tray-icon.png
│   └── cats/                         # 猫咪模型/精灵图
│       ├── tsundere/
│       │   ├── tsundere.model3.json
│       │   └── *.png
│       └── ...
│
├── src/
│   ├── main/                         # Electron 主进程
│   │   ├── index.ts                  # 入口，app 生命周期
│   │   ├── windows/
│   │   │   ├── petWindow.ts          # 浮动宠物窗口
│   │   │   └── chatWindow.ts         # 聊天面板窗口
│   │   ├── tray.ts                   # 系统托盘
│   │   └── ipc/
│   │       ├── window.ts             # 窗口 IPC 处理
│   │       └── index.ts
│   │
│   ├── preload/                      # 预加载脚本
│   │   └── index.ts                  # contextBridge 暴露 API
│   │
│   └── renderer/                     # 渲染进程（React）
│       ├── pet-window/               # 浮动猫咪窗口
│       │   ├── index.html
│       │   ├── main.tsx
│       │   ├── App.tsx               # 猫咪动画 + 鼠标穿透
│       │   └── components/
│       │       ├── CatSprite.tsx     # 精灵图方案
│       │       └── CatLive2D.tsx     # Live2D 方案
│       │
│       └── chat-window/              # 聊天面板窗口
│           ├── index.html
│           ├── main.tsx
│           └── src/
│               ├── App.tsx
│               ├── api/
│               │   ├── types.ts
│               │   ├── chat.ts       # SSE 流式
│               │   ├── pets.ts       # 列表/状态
│               │   └── adopt.ts     # 收养
│               ├── hooks/
│               │   ├── usePetStatus.ts
│               │   ├── useOwnerPets.ts
│               │   └── useStreamChat.ts
│               ├── store/
│               │   ├── chatHistory.ts
│               │   └── appStore.ts
│               └── pages/
│                   ├── ChatPage.tsx      # 主聊天界面
│                   ├── PetListPage.tsx   # 宠物列表
│                   ├── AdoptPage.tsx     # 收养流程
│                   └── StatusPage.tsx    # 宠物详细状态
```

---

## 8. 核心模块实现要点

### 8.1 流式聊天 UI（打字机效果）

```typescript
// src/renderer/chat-window/hooks/useStreamChat.ts
export function useStreamChat(petId: string) {
  const [streaming, setStreaming] = useState(false)
  const [currentReply, setCurrentReply] = useState('')
  const addMessage = useChatStore(s => s.addMessage)

  const sendMessage = useCallback(async (content: string) => {
    addMessage(petId, { role: 'user', content, timestamp: Date.now() })
    setStreaming(true)
    setCurrentReply('')

    let fullReply = ''
    for await (const chunk of streamChat(petId, content)) {
      fullReply += chunk
      setCurrentReply(fullReply)
    }

    addMessage(petId, { role: 'assistant', content: fullReply, timestamp: Date.now() })
    setCurrentReply('')
    setStreaming(false)
  }, [petId])

  return { sendMessage, streaming, currentReply }
}
```

### 8.2 宠物状态可视化

```tsx
// src/renderer/chat-window/components/StatusPanel.tsx
// bond 值展示为圆形进度，stats 展示为彩色进度条，soul 展示为描述性文字
```

### 8.3 猫咪情绪响应

根据 bond 值和对话内容更新猫咪动画状态：

```typescript
// 在 chatWindow 接收到 SSE 完成后，通知 petWindow 切换动画
window.electronAPI.notifyPetEmotion('happy')  // 或 'sad', 'surprised'
```

---

## 9. 跨平台注意事项

### macOS

- `transparent` 窗口需要 `hasShadow: false`，否则会有残影
- `setIgnoreMouseEvents` 的 `forward` 参数**不支持**，需改用定时检测鼠标位置
- `vibrancy: 'under-window'` 实现毛玻璃聊天窗口
- 首次分发时用户会看到"应用已损坏"警告（未签名），文档中需说明解决方法：`xattr -cr /Applications/App.app`
- 全屏模式下 alwaysOnTop 需要 `visibleOnFullScreen: true`

### Windows

- `backgroundMaterial: 'acrylic'` 实现 Windows 11 Mica 效果（需 Windows 11）
- 鼠标穿透拖动时有 flicker bug（Electron issue #35030），缓解方案：延迟 16ms 再切换状态
- 系统托盘图标需要 `.ico` 格式（png 在某些系统上不显示）

### Linux

- 透明窗口需要合成器（如 Picom），否则显示黑色背景
- 无 macOS `vibrancy` / Windows `acrylic`，聊天窗口使用纯色背景

---

## 10. Agent 编程建议

### 推荐工作流

使用 Claude Code / Cursor / Windsurf 进行 agent 辅助开发时：

1. **先让 agent 生成类型定义**（`src/renderer/api/types.ts`），确认后再生成其他模块
2. **每次只让 agent 处理一个页面/组件**，避免上下文窗口过大
3. **IPC 通道名称统一管理**，新建 `src/shared/ipc-channels.ts` 常量文件，agent 引用而非自由发挥
4. **API 请求层先写，hooks 后写**，hooks 基于 API 层，避免 agent 混淆两层职责
5. **shadcn 组件用 copy-paste 方式引入**，不要让 agent 自己写基础 UI 组件

### Prompt 模板示例

```
基于以下接口定义，生成 ChatPage.tsx 组件：
- 接口类型：见 src/renderer/api/types.ts
- 使用 useStreamChat hook（已存在）
- 使用 useChatStore 获取历史（已存在）  
- 使用 shadcn/ui 的 ScrollArea、Input、Button 组件
- 聊天气泡：用户消息右对齐，猫咪消息左对齐
- 流式回复时显示光标动画
- 不要引入新的依赖
```

---

## 11. 开发路线图

### Phase 1 — 基础框架（1-2天）

- [x] electron-vite 脚手架搭建
- [ ] 双窗口系统（petWindow + chatWindow）
- [ ] IPC 通道建立
- [ ] 系统托盘
- [ ] 鼠标穿透动态切换

### Phase 2 — 猫咪形象（1天）

- [ ] 精灵图方案实现（至少一种性格）
- [ ] 空闲/说话动画切换
- [ ] 猫咪可拖拽移动

### Phase 3 — 聊天核心（1-2天）

- [ ] SSE 流式聊天
- [ ] 聊天历史本地存储
- [ ] 打字机效果 UI

### Phase 4 — 宠物管理（1天）

- [ ] 宠物列表页面
- [ ] 收养流程
- [ ] 状态展示（bond/stats/soul）

### Phase 5 — 打磨（1天）

- [ ] 多性格猫咪形象
- [ ] 情绪响应系统
- [ ] 跨平台测试
- [ ] electron-builder 打包配置

---

## 参考资源

| 资源 | 用途 |
|---|---|
| [liwenka1/bongo-cat-next](https://github.com/liwenka1/bongo-cat-next) | Live2D 猫咪 + 透明窗口参考 |
| [WanNianYanHuo/-Live2d-](https://github.com/WanNianYanHuo/-Live2d-) | Electron + PixiJS + Live2D 桌宠参考 |
| [daltonmenezes/electron-app](https://github.com/daltonmenezes/electron-app) | React 19 + Tailwind 4 + shadcn Electron boilerplate |
| [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) | Live2D + PixiJS 渲染库 |
| [Electron 透明窗口文档](https://www.electronjs.org/docs/latest/tutorial/custom-window-styles) | 透明窗口官方文档 |
| [Electron setIgnoreMouseEvents](https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions) | 鼠标穿透官方文档 |