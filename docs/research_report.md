# GitHub 开源桌面宠物项目研究报告

## 项目概况

**项目名称**: Convai Desktop Pet  
**GitHub 链接**: https://github.com/AkshitIreddy/convai-desktop-pet  
**技术栈**: Electron 33.2.1 + JavaScript (原生 DOM/Canvas 混合)  
**最新版本**: v1.1.0  
**开源协议**: ISC  

### 项目特点
- 支持多个可爱的 AI 动画角色（Genshin Impact 角色 + 其他 IP）
- 完整的物理模拟（重力、速度阻尼）
- 复杂的行为状态机（行走、攀爬、下落、特殊动作、待机动作）
- 集成 Convai AI 对话引擎
- 跨平台支持（Windows/macOS/Linux）

---

## 1. 桌面宠物动效实现方式

### 1.1 动画系统架构

#### 核心概念：精灵表动画 (Sprite Sheet Animation)

**精灵表配置方式** (`characters.json`)：
```json
{
  "ayaka": {
    "character_id": "d0ad4248-c743-11ef-a477-42010a7be016",
    "walk_max_frame": 3,           // 行走帧数
    "drag_max_frames": 6,          // 拖拽帧数
    "fall_max_frames": 5,          // 下落帧数
    "climb_max_frames": 3,         // 攀爬帧数
    "special_actions": {...},      // 特殊动作配置
    "idle_actions": {...}          // 待机动作配置
  }
}
```

**关键特性**：
- 每个状态都有独立的帧集合
- 动作可配置 `loop`、`loop_times`、`loop_end_only` 参数
- 支持多个 Special Action 和 Idle Action
- 帧序列通过文件路径动态加载：`assets/{characterName}/{actionType}{frameNumber}.png`

#### 动画渲染方法：背景图片替换

```css
#pet {
    width: 100px;
    height: 100px;
    position: fixed;
    background-image: url('assets/walk1.png');    /* 通过换图实现逐帧动画 */
    background-size: contain;
    background-repeat: no-repeat;
    will-change: transform, background-image, left, bottom;
    transition: transform 0.3s ease-in-out;
}
```

**优点**：
- 无需 Canvas，纯 DOM 操作
- 渲染性能高
- 支持复杂的图形特效（阴影、模糊等）

**缺点**：
- 需要预加载所有帧图片
- 不能实时动态生成动画

### 1.2 动画循环机制

```javascript
function updateAnimation(currentTime) {
    if (currentTime - lastFrameTime > frameDuration) {
        // frameDuration 默认 200ms，可调整速度
        
        let frames;
        if (state === 'falling') {
            // 下落状态不更新帧
        } else if (state === 'specialAction') {
            frames = specialActionFrames;
        } else if (state === 'idleAction') {
            frames = idleActionFrames;
        } else if (state.includes('climb')) {
            frames = climbFrames;
        } else {
            frames = walkFrames;  // 默认行走
        }
        
        // 帧序列循环
        frame = (frame + 1) % frames.length;
        pet.style.backgroundImage = `url('${frames[frame]}')`;
        
        lastFrameTime = currentTime;
    }
}

// 主循环（60 FPS requestAnimationFrame）
function updatePet(currentTime) {
    updateAnimation(currentTime);       // 每 200ms 更换一帧
    
    if (currentTime - lastMoveTime > moveDuration) {
        updatePosition();                // 每 12ms 更新位置
        lastMoveTime = currentTime;
    }
    
    animationFrameId = requestAnimationFrame(updatePet);
}
```

**关键点**：
- **帧时间与位置更新分离**：动画帧 (200ms) 更新频率 < 位置 (12ms) 更新频率
- 使用 `requestAnimationFrame` 实现 60 FPS 主循环
- 时间戳方式控制帧更新，避免固定帧率问题

### 1.3 窗口透明 + 动画配合

```javascript
// Electron 窗口配置
const petWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight - taskbarGap,
    x: 0,
    y: 0,
    transparent: true,              // 关键：透明背景
    frame: false,                   // 无边框
    alwaysOnTop: true,              // 浮在最上层
    skipTaskbar: true,              // 隐藏任务栏
    focusable: false,               // 不响应焦点
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    }
})

// 默认忽略鼠标事件，允许穿透点击
petWindow.setIgnoreMouseEvents(true, { forward: true })
```

**实现细节**：
- 整个窗口填满屏幕，但透明
- 宠物本身通过 `position: fixed` 独立定位
- 当鼠标悬停宠物时切换鼠标穿透模式

### 1.4 鼠标交互

#### 拖拽机制
```javascript
pet.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragOffsetX = e.clientX - position.x;
    dragOffsetY = e.clientY - position.y;
    
    // 随机选择拖拽帧
    currentDragFrame = dragFrames[Math.floor(Math.random() * dragFrames.length)];
    pet.style.backgroundImage = `url('${currentDragFrame}')`;
    
    pet.classList.add('dragging');
    ipcRenderer.send('set-ignore-mouse-events', false);  // 启用鼠标事件
});

document.addEventListener("mousemove", (e) => {
    if (isDragging) {
        position.x = e.clientX - dragOffsetX;
        position.y = e.clientY - dragOffsetY;
        updatePetPosition();
    }
});

document.addEventListener("mouseup", () => {
    if (isDragging) {
        isDragging = false;
        state = 'falling';              // 松开后开始下落
        velocity = { x: 0, y: 0 };
        fallAnimationStarted = false;
    }
});
```

#### 对话交互（Alt+Click）
```javascript
pet.addEventListener("mousedown", (e) => {
    if (e.altKey) {
        // 创建文本输入框
        ipcRenderer.send('set-window-focusable', true);
        
        // 显示输入框
        textBox = document.createElement('div');
        textBox.style.position = 'absolute';
        textBox.style.zIndex = '1000';
        
        // 输入框跟随宠物位置
        updateTextBoxPosition();
    }
});
```

**交互方式**：
- **拖拽**：自由拖放，松开后下落
- **对话**：Alt + Click 弹出输入框
- **鼠标事件穿透**：default state 允许点击背后的窗口

---

## 2. 桌面对话功能

### 2.1 对话气泡设计

#### 两层对话系统

1. **用户输入框**（文本输入）
```javascript
const input = document.createElement('input');
input.type = 'text';
input.style.width = '200px';
input.style.background = '#3a3a3a';
input.style.color = 'white';
input.style.border = '1px solid #555';

// 绑定到提交按钮
submitBtn.onclick = async () => {
    const userText = input.value;
    // 发送给 AI 后端
    await convaiClient.sendText(userText);
    
    // 关闭输入框
    document.body.removeChild(textBox);
    ipcRenderer.send('set-window-focusable', false);
};
```

2. **AI 响应气泡**（文本输出 + 语音）
```javascript
function showResponseBox(text) {
    if (!responseBox) {
        responseBox = document.createElement('div');
        responseBox.style.position = 'absolute';
        responseBox.style.zIndex = '1000';
        responseBox.style.backgroundColor = '#3a3a3a';
        responseBox.style.border = '1px solid #555';
        responseBox.style.maxWidth = '300px';
        responseBox.style.color = 'white';
        
        document.body.appendChild(responseBox);
    }
    
    responseBox.textContent = text;
    updateResponseBoxPosition();  // 跟随宠物位置
    
    // 音频停止时自动关闭
    if (!isNPCTalking) {
        responseBox.remove();
    }
}
```

### 2.2 气泡位置系统

```javascript
function updateResponseBoxPosition() {
    const offset = 20;
    
    if (state.includes('climbingTop')) {
        // 宠物在顶部时，气泡显示在下方
        responseBox.style.left = `${position.x}px`;
        responseBox.style.top = `${position.y + 3*offset}px`;
    } else if (state.includes('climbingLeft')) {
        // 宠物在左侧时，气泡显示在右侧
        responseBox.style.left = `${position.x + offset}px`;
        responseBox.style.top = `${position.y - 1.3*boxHeight}px`;
    } else if (state.includes('climbingRight')) {
        // 宠物在右侧时，气泡显示在左侧
        responseBox.style.left = `${position.x - boxWidth + 2*offset}px`;
        responseBox.style.top = `${position.y - (boxHeight/2)}px`;
    } else {
        // 默认在宠物上方
        responseBox.style.left = `${position.x - (boxWidth/4)}px`;
        responseBox.style.bottom = `${screenHeight - position.y + offset/5}px`;
    }
}

// 持续更新位置（50ms）
responseBoxUpdateInterval = setInterval(updateResponseBoxPosition, 50);
```

### 2.3 AI 对接（Convai SDK）

```javascript
const { ConvaiClient } = require('convai-web-sdk');

const convaiClient = new ConvaiClient({
    apiKey: apiKey,
    characterId: characterId,
    enableAudio: true,
    sessionId: "-1",
    micUsage: false
});

// 响应处理
convaiClient.setResponseCallback((response) => {
    if (response.hasAudioResponse()) {
        const audioResponse = response.getAudioResponse();
        showResponseBox(audioResponse.getTextData());  // 显示文本
        // 音频自动播放
    }
});

// 音频状态监听
convaiClient.onAudioPlay(() => {
    isNPCTalking = true;    // 正在说话
});

convaiClient.onAudioStop(() => {
    isNPCTalking = false;   // 说话完毕，气泡可关闭
});
```

---

## 3. 连接状态展示

当前项目中**未实现连接状态指示**，但基础架构支持添加：

### 推荐实现方案

```javascript
// 在 petWindow 中添加状态指示
const statusIndicator = document.createElement('div');
statusIndicator.style.position = 'fixed';
statusIndicator.style.top = '10px';
statusIndicator.style.right = '10px';
statusIndicator.style.width = '12px';
statusIndicator.style.height = '12px';
statusIndicator.style.borderRadius = '50%';

// 状态映射
const statusColors = {
    'connected': '#00ff00',    // 绿色
    'connecting': '#ffff00',   // 黄色
    'disconnected': '#ff0000'  // 红色
};

// 监听连接状态
convaiClient.onConnectionChange((state) => {
    statusIndicator.style.backgroundColor = statusColors[state];
});
```

---

## 4. 技术栈详解

### 4.1 核心框架

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **主进程** | Electron | 33.2.1 | 窗口管理、IPC 通信 |
| **渲染进程** | HTML5 + Vanilla JS | - | UI 渲染、动画控制 |
| **AI 集成** | ConvAI SDK | 0.1.4 | 文本-语音合成、对话 |
| **状态管理** | Electron Store | 10.0.0 | 配置持久化 |
| **构建工具** | Electron Builder | 25.1.8 | 跨平台打包 |

### 4.2 动画库/渲染方式

**不使用第三方动画库**，全部基于：
- **帧切换**：`backgroundImage` CSS 属性
- **位置变换**：`transform: scaleX() rotate()` + `position: fixed`
- **主循环**：`requestAnimationFrame`

**优势**：
- 零依赖，轻量级
- 兼容性强
- 性能优异（不涉及 Canvas 重排）

**劣势**：
- 无法实时动态效果
- 需要大量预制帧图

### 4.3 窗口管理方式

```javascript
// 创建透明浮动窗口
const petWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight - taskbarGap,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    }
})

petWindow.setIgnoreMouseEvents(true, { forward: true })  // 鼠标穿透
petWindow.setVisibleOnAllWorkspaces(true)                // 所有桌面可见
```

**特点**：
- 单一窗口填满屏幕，但透明
- 多个宠物通过不同的 HTML 元素并行渲染
- 主进程通过 IPC 控制各宠物状态

---

## 5. 可借鉴的设计模式

### 5.1 宠物行为状态机

**状态定义**：
```javascript
const states = {
    'falling': 'idle 下落',
    'walkingLeftBottom': '在底部向左行走',
    'walkingRightBottom': '在底部向右行走',
    'climbingLeftSidebarDownToUp': '沿左侧边框向上爬',
    'climbingLeftSidebarUpToDown': '沿左侧边框向下爬',
    'climbingTopLeft': '沿顶部向左爬',
    'climbingTopRight': '沿顶部向右爬',
    'climbingRightSidebarDownToUp': '沿右侧边框向上爬',
    'climbingRightSidebarUpToDown': '沿右侧边框向下爬',
    'specialAction': '特殊动作（如释放魔法）',
    'idleAction': '待机动作（坐下、思考）'
}
```

**状态转移逻辑**：
```javascript
function updatePosition() {
    switch (state) {
        case 'falling':
            falling();                          // 重力模拟
            break;
        case 'walkingLeftBottom':
            walkingLeftBottom();                // 水平移动
            if (position.x <= 0) {
                state = 'climbingLeftSidebarDownToUp';  // 边界触发
            }
            break;
        case 'climbingLeftSidebarDownToUp':
            climbingLeftSidebarDownToUp();      // 沿边框移动
            if (position.y <= 0) {
                state = 'climbingTopLeft';      // 抵达角落
            }
            break;
        // ...更多状态转移
    }
}
```

**特点**：
- **显式状态机**：11 个清晰的状态
- **自动转移**：边界检测、概率决策
- **嵌套选择**：选择 idleAction / specialAction / walk 的概率分布
  ```javascript
  function selectAction() {
      const randomValue = Math.random();
      if (randomValue < 0.2) {
          selectIdleAction();       // 20% 概率待机
      } else if (randomValue < 0.5) {
          selectSpecialAction();    // 30% 概率特殊动作
      } else {
          selectRandomWalk();       // 50% 概率行走
      }
  }
  ```

### 5.2 动画切换逻辑

**特殊动作配置**（支持循环控制）：
```json
"special_actions": {
    "special_action_1": {
        "max_frames": 3,
        "loop": true,
        "loop_times": 30,           // 循环 30 次后转换
        "description": "Cherry blossom sitting"
    },
    "special_action_2": {
        "max_frames": 5,
        "loop": true,
        "loop_end_only": true,      // 只在最后一帧循环（动作开始→结束）
        "loop_times": 5,
        "description": "japanese fan opening"
    }
}
```

**循环处理**：
```javascript
if (state === 'specialAction' && frame === frames.length - 1) {
    if (currentSpecialAction.loop) {
        specialActionLoopCount++;
        if (specialActionLoopCount >= currentSpecialAction.loop_times) {
            selectAction();  // 动作完成，选择下一个
        } else if (specialActionLoopEndOnly) {
            frame = frames.length - 1;  // 停留在最后一帧
        }
    } else {
        selectAction();
    }
}
```

### 5.3 桌面漫游/随机行为机制

**地图分割策略**：
- 屏幕分为 9 个区域（左/中/右 × 上/中/下）
- 宠物能攀爬四条边框（left/right/top sidebar）
- 在底部可随机行走

**行为调度**：
```javascript
// 计算随机行走距离（屏幕宽度的 1/6 到 1/3）
function calculateWalkDistance() {
    return Math.floor(Math.random() * (screenWidth / 6)) + 
           Math.floor(screenWidth / 6);
}

// 攀爬过程中的随机中断（50% 概率）
function shouldContinueClimbing() {
    return Math.random() < 0.5;
}

// 当到达屏幕中点时，50% 概率下落、50% 概率继续爬
if (position.y >= screenHeight / 2) {
    if (!shouldContinueClimbing()) {
        startFalling('right');  // 转向下落
        return;
    }
}
```

**物理模拟**（下落时）：
```javascript
function falling() {
    velocity.y += gravity;           // 每帧加速
    velocity.y *= damping;           // 空气阻尼（0.98）
    position.y += velocity.y;
    
    if (position.y >= landingY) {
        // 着陆后播放着陆动画，然后转换状态
        selectAction();
    }
}
```

**性能优化**：
- 帧时间与位置更新分离（200ms vs 12ms）
- `will-change` CSS 优化
- 预计算常量（如 `landingY`）

---

## 6. 对 6mao 项目的借鉴方案

### 6.1 快速可复用组件

#### Option A：直接采用 Convai 项目的动画系统

**优点**：
- 已验证的完整实现
- 精灵表配置简单明了
- 物理模拟成熟

**缺点**：
- 使用纯 JavaScript（非 TypeScript）
- 需要适配 React 组件
- 不支持 Live2D

**建议**：抽取核心逻辑，改写为 React Hook + TypeScript

#### Option B：分层架构改造

```typescript
// 1. 动画引擎层（与框架无关）
class PetAnimationEngine {
    currentFrame: number = 0
    state: PetState = 'idle'
    frameSequences: Map<string, string[]>
    
    updateFrame(deltaTime: number): void {
        // 核心帧切换逻辑
    }
    
    updatePosition(deltaTime: number): void {
        // 物理更新
    }
}

// 2. React 绑定层
function PetAnimationComponent({
    pet,
    engine
}: {
    pet: PetData
    engine: PetAnimationEngine
}) {
    const [currentImage, setCurrentImage] = useState<string>()
    const [position, setPosition] = useState({ x: 0, y: 0 })
    
    useAnimationFrame((deltaTime) => {
        engine.updateFrame(deltaTime)
        engine.updatePosition(deltaTime)
        
        setCurrentImage(engine.getCurrentFrame())
        setPosition(engine.getPosition())
    })
    
    return (
        <div
            style={{
                backgroundImage: `url('${currentImage}')`,
                left: `${position.x}px`,
                bottom: `${position.y}px`
            }}
        />
    )
}

// 3. IPC 通信层（已有基础）
ipcRenderer.on('pet-emotion', (emotion) => {
    engine.setState(emotion)
})
```

### 6.2 精灵表配置标准化

**建议格式**（基于 Convai）：

```typescript
interface PetCharacterConfig {
    id: string
    name: string
    
    // 帧配置
    animations: {
        walk: {
            frameCount: number
            frameDuration: number  // ms
        }
        climb: AnimationConfig
        fall: AnimationConfig
        idle: {
            variants: Array<{
                name: string
                frameCount: number
                loopTimes: number
                loopEndOnly?: boolean
            }>
        }
        special: {
            variants: AnimationConfig[]
        }
    }
    
    // 物理参数
    physics: {
        gravity: number
        damping: number
    }
    
    // 行为概率
    behavior: {
        idleProbability: number       // 20%
        specialActionProbability: number  // 30%
        walkProbability: number       // 50%
    }
}
```

### 6.3 适配 6mao 现有架构

#### 当前 petWindow 结构
```
/pet-window/src/
  ├── App.tsx           (状态管理、IPC 监听)
  ├── components/
  │   ├── CatSprite.tsx (静态 PNG 渲染)
  │   ├── CatLive2D.tsx (Live2D 渲染)
  │   └── PetRenderer.tsx
  ├── personality.ts    (角色配置)
  └── types.ts
```

#### 改造方向

**方案 1：轻微改造**（适合快速上线）
```typescript
// personality.ts 中扩展配置
export const PERSONALITY_CONFIGS = {
    scholar: {
        // 现有配置
        spritePath: '/cats/scholar.png',
        color: '#...',
        
        // 新增动画配置
        animations: {
            walk: { frameCount: 4, frameDuration: 150 },
            idle: { frameCount: 2, loopTimes: 10 },
            special: [{ ... }]
        }
    }
}

// CatSprite.tsx 中替换为动画版本
export function CatSpriteAnimated({
    pet,
    emotion,
    ...props
}: PetRendererProps) {
    const [currentFrame, setCurrentFrame] = useState(0)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    
    const engine = usePetAnimationEngine(pet, emotion)
    
    useAnimationFrame(() => {
        engine.tick()
        setCurrentFrame(engine.frame)
        setPosition(engine.position)
    })
    
    return (
        <img
            src={engine.getFrameImage()}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`
            }}
        />
    )
}
```

**方案 2：完整重构**（支持多个渲染器选择）
```typescript
// 抽象渲染接口
interface PetRenderer {
    render(engine: PetAnimationEngine): ReactNode
}

class SpriteSheetRenderer implements PetRenderer {
    render(engine: PetAnimationEngine) { ... }
}

class PixiRenderer implements PetRenderer {
    render(engine: PetAnimationEngine) { ... }
}

class Live2DRenderer implements PetRenderer {
    render(engine: PetAnimationEngine) { ... }
}

// App.tsx 中选择渲染器
const renderer = mode === 'sprite' ? new SpriteSheetRenderer() : ...
```

### 6.4 连接状态展示集成

在 petWindow 中添加状态指示器：

```typescript
// petWindow/src/components/StatusIndicator.tsx
export function StatusIndicator() {
    const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected')
    
    useEffect(() => {
        const removeListener = window.electronAPI.onDaemonStatusChange((status) => {
            setStatus(status)
        })
        return removeListener
    }, [])
    
    return (
        <div
            className="fixed top-2 right-2 w-3 h-3 rounded-full"
            style={{
                backgroundColor: {
                    'connected': '#10b981',
                    'connecting': '#f59e0b',
                    'disconnected': '#ef4444'
                }[status]
            }}
        />
    )
}
```

### 6.5 对话气泡集成

在现有 `CatSprite.tsx` 的 proactiveText 基础上扩展：

```typescript
export function CatSpriteWithDialog({
    pet,
    emotion,
    proactiveText,
    onMessageSubmit,
    ...props
}: PetRendererProps & {
    onMessageSubmit: (text: string) => void
}) {
    const [showInputBox, setShowInputBox] = useState(false)
    
    const handleAltClick = () => {
        setShowInputBox(true)
    }
    
    return (
        <>
            <CatSprite
                {...props}
                onClick={handleAltClick}
                proactiveText={proactiveText}
            />
            
            {showInputBox && (
                <ChatInputBox
                    position={...}
                    onSubmit={(text) => {
                        onMessageSubmit(text)
                        setShowInputBox(false)
                    }}
                    onClose={() => setShowInputBox(false)}
                />
            )}
        </>
    )
}
```

---

## 7. 存在的问题与改进建议

### 7.1 当前 Convai 项目的不足

| 问题 | 影响 | 改进方案 |
|------|------|--------|
| 纯 JavaScript，难以类型化 | 维护成本高 | 使用 TypeScript 重写 |
| 使用 `nodeIntegration: true` | 安全风险 | 迁移到 preload 脚本 + contextIsolation |
| 固定帧率（200ms）| 动画效果受限 | 支持可配置的 easing 函数 |
| 无网络状态指示 | UX 不清晰 | 添加状态指示器 |
| 不支持批量宠物 | 不适合多宠物场景 | 使用宠物池模式 |

### 7.2 针对 6mao 的优化建议

#### 1. 渲染器插件化
```typescript
// renderer/pet-window/src/renderers/index.ts
export interface IPetRenderer {
    name: 'sprite' | 'live2d' | 'pixi'
    renderFrame(engine: PetAnimationEngine): ReactNode
    getCapabilities(): RenderCapability[]
}

// 允许动态选择
const renderer = RENDERERS[mode]
```

#### 2. 动画配置外部化
```yaml
# cats/scholar.yaml
animations:
  walk:
    frames: 4
    duration: 150
    assetPath: /assets/scholar/walk{n}.png
  
  idle:
    - name: sitting
      frames: 1
      loopTimes: 15
    - name: thinking
      frames: 2
      loopTimes: 10
  
  special:
    - name: paw_wave
      frames: 4
      duration: 150
      
physics:
  gravity: 0.1
  damping: 0.98
```

#### 3. 添加可视化调试工具
```typescript
// 开发时可视化状态机
<PetDebugger
    engine={engine}
    showStates={true}
    showPhysics={true}
/>
```

---

## 8. 总结与推荐方案

### 推荐路线

**Phase 1（快速原型，2-3 周）**：
- 采用 Convai 的精灵表+状态机设计
- 用 TypeScript 重写核心动画引擎
- 集成到现有 petWindow 中
- 输出：会走路、攀爬、下落的猫咪

**Phase 2（完整功能，2-3 周）**：
- 添加拖拽交互
- 实现对话气泡
- 集成连接状态指示
- 支持多个 idle/special 动作

**Phase 3（增强体验，1-2 周）**：
- 支持 Live2D/Pixi 切换
- 添加音效反馈
- 游戏化互动（挠痒、喂食等）
- 性能优化（动画预加载、缓存）

### 关键技术文件

| 文件 | 行数 | 核心职责 |
|------|------|--------|
| `pet.js` | 933 | 主动画引擎，包含状态机、物理、交互 |
| `main.js` | 250+ | Electron 主进程，窗口管理 |
| `pet.css` | 15 | 样式配置 |
| `characters.json` | 150+ | 角色精灵表配置 |
| `characterStore.js` | - | 配置持久化 |

### 代码复用度评估

| 模块 | 复用度 | 适配工作 |
|------|--------|--------|
| 状态机架构 | 90% | 低（逻辑清晰） |
| 动画循环 | 85% | 中（需要 React 绑定） |
| 物理模拟 | 95% | 低（独立计算） |
| 交互系统 | 70% | 中-高（IPC 集成） |
| UI 组件 | 40% | 高（需要重新设计） |

