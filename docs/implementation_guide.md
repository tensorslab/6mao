# 6mao 项目动画系统改造实现指南

## 一、核心动画引擎（TypeScript 实现）

### 文件：`src/renderer/pet-window/src/animation/PetAnimationEngine.ts`

```typescript
// 定义所有宠物状态
export type PetState = 
  | 'falling'
  | 'walkingLeftBottom'
  | 'walkingRightBottom'
  | 'climbingLeftSidebarDownToUp'
  | 'climbingLeftSidebarUpToDown'
  | 'climbingRightSidebarDownToUp'
  | 'climbingRightSidebarUpToDown'
  | 'climbingTopLeft'
  | 'climbingTopRight'
  | 'specialAction'
  | 'idleAction'
  | 'idle'

export interface AnimationFrame {
  imagePath: string
  duration: number
}

export interface AnimationConfig {
  frames: AnimationFrame[]
  loop?: boolean
  loopTimes?: number
  loopEndOnly?: boolean
}

export interface PetAnimationConfig {
  walk: AnimationConfig
  climb: AnimationConfig
  fall: AnimationConfig
  drag: AnimationConfig
  special: Map<string, AnimationConfig>
  idle: Map<string, AnimationConfig>
}

export interface PhysicsConfig {
  gravity: number
  damping: number
  petWidth: number
  petHeight: number
}

export class PetAnimationEngine {
  // 状态
  private state: PetState = 'falling'
  private position: { x: number; y: number } = { x: 0, y: 0 }
  private velocity: { x: number; y: number } = { x: 0, y: 0 }
  private frame: number = 0

  // 动画时间
  private lastFrameTime: number = 0
  private lastMoveTime: number = 0
  private frameDuration: number = 200
  private moveDuration: number = 12

  // 当前动作
  private currentSpecialAction: string | null = null
  private specialActionLoopCount: number = 0
  private specialActionLoopEndOnly: boolean = false
  private currentIdleAction: string | null = null
  private idleActionLoopCount: number = 0

  // 行走距离
  private remainingWalkDistance: number = 0
  private nextState: PetState = 'idle'
  private midpointCheckDone: boolean = false

  // 物理
  private screenWidth: number
  private screenHeight: number
  private landingY: number
  private fallAnimationStarted: boolean = false

  // 配置
  private animConfig: PetAnimationConfig
  private physicsConfig: PhysicsConfig

  constructor(
    animConfig: PetAnimationConfig,
    physicsConfig: PhysicsConfig,
    screenWidth: number,
    screenHeight: number
  ) {
    this.animConfig = animConfig
    this.physicsConfig = physicsConfig
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
    this.landingY = screenHeight - physicsConfig.petHeight
    this.position = {
      x: Math.random() * (screenWidth - physicsConfig.petWidth),
      y: 0
    }
  }

  // 获取当前帧图片路径
  getCurrentFrameImage(): string {
    let frames: AnimationFrame[] = []

    if (this.state === 'falling') {
      frames = this.animConfig.fall.frames
    } else if (this.state === 'specialAction' && this.currentSpecialAction) {
      const config = this.animConfig.special.get(this.currentSpecialAction)
      frames = config?.frames || []
    } else if (this.state === 'idleAction' && this.currentIdleAction) {
      const config = this.animConfig.idle.get(this.currentIdleAction)
      frames = config?.frames || []
    } else if (this.state.includes('climb')) {
      frames = this.animConfig.climb.frames
    } else if (this.state.includes('walking')) {
      frames = this.animConfig.walk.frames
    } else {
      frames = this.animConfig.walk.frames
    }

    return frames[this.frame]?.imagePath || ''
  }

  // 获取变换信息
  getTransform(): string {
    if (this.state === 'walkingLeftBottom') {
      return 'scaleX(1) rotate(0deg)'
    } else if (this.state === 'walkingRightBottom') {
      return 'scaleX(-1) rotate(0deg)'
    } else if (this.state === 'climbingLeftSidebarDownToUp' || 
               this.state === 'climbingLeftSidebarUpToDown') {
      return 'scaleX(1) rotate(0deg)'
    } else if (this.state === 'climbingRightSidebarDownToUp' || 
               this.state === 'climbingRightSidebarUpToDown') {
      return 'scaleX(-1) rotate(0deg)'
    } else if (this.state === 'climbingTopLeft') {
      return 'scaleX(-1) rotate(90deg)'
    } else if (this.state === 'climbingTopRight') {
      return 'scaleX(1) rotate(90deg)'
    }
    return 'rotate(0deg)'
  }

  // 更新帧
  updateFrame(currentTime: number): void {
    if (currentTime - this.lastFrameTime > this.frameDuration) {
      let frames: AnimationFrame[] = []

      if (this.state === 'falling') {
        if (!this.fallAnimationStarted) {
          this.moveDuration = 8
          this.frame = 0
        }
      } else if (this.state === 'specialAction' && this.currentSpecialAction) {
        frames = this.animConfig.special.get(this.currentSpecialAction)?.frames || []
      } else if (this.state === 'idleAction' && this.currentIdleAction) {
        frames = this.animConfig.idle.get(this.currentIdleAction)?.frames || []
      } else if (this.state.includes('climb')) {
        frames = this.animConfig.climb.frames
      } else if (this.state.includes('walking')) {
        frames = this.animConfig.walk.frames
      }

      if (frames.length > 0) {
        const config = 
          this.state === 'specialAction' ? this.animConfig.special.get(this.currentSpecialAction!) :
          this.state === 'idleAction' ? this.animConfig.idle.get(this.currentIdleAction!) :
          null

        if (this.state === 'specialAction' && this.specialActionLoopEndOnly && config) {
          if (this.frame < frames.length - 1 || this.specialActionLoopCount === 0) {
            this.frame = (this.frame + 1) % frames.length
          }
        } else {
          this.frame = (this.frame + 1) % frames.length
        }

        // 处理循环完成
        if (this.state === 'specialAction' && this.frame === frames.length - 1) {
          if (config?.loop) {
            this.specialActionLoopCount++
            if (this.specialActionLoopCount >= (config?.loopTimes || 1)) {
              this.selectAction()
            } else if (this.specialActionLoopEndOnly) {
              this.frame = frames.length - 1
            }
          } else {
            this.selectAction()
          }
        } else if (this.state === 'idleAction' && this.frame === frames.length - 1) {
          if (config?.loop) {
            this.idleActionLoopCount++
            if (this.idleActionLoopCount >= (config?.loopTimes || 1)) {
              this.selectAction()
            }
          } else {
            this.selectAction()
          }
        }
      }

      this.lastFrameTime = currentTime
    }
  }

  // 更新位置
  updatePosition(currentTime: number): void {
    if (currentTime - this.lastMoveTime > this.moveDuration) {
      this.updatePositionLogic()
      this.lastMoveTime = currentTime
    }
  }

  private updatePositionLogic(): void {
    switch (this.state) {
      case 'falling':
        this.falling()
        break
      case 'walkingLeftBottom':
        this.walkingLeftBottom()
        break
      case 'walkingRightBottom':
        this.walkingRightBottom()
        break
      case 'climbingLeftSidebarDownToUp':
        this.climbingLeftSidebarDownToUp()
        break
      case 'climbingLeftSidebarUpToDown':
        this.climbingLeftSidebarUpToDown()
        break
      case 'climbingRightSidebarDownToUp':
        this.climbingRightSidebarDownToUp()
        break
      case 'climbingRightSidebarUpToDown':
        this.climbingRightSidebarUpToDown()
        break
      case 'climbingTopLeft':
        this.climbingTopLeft()
        break
      case 'climbingTopRight':
        this.climbingTopRight()
        break
      // specialAction 和 idleAction 不改变位置
    }
  }

  private walkingLeftBottom(): void {
    if (this.remainingWalkDistance > 0) {
      this.position.x -= 1
      this.remainingWalkDistance--
    } else {
      this.selectAction()
    }
    if (this.position.x <= 0) {
      this.state = 'climbingLeftSidebarDownToUp'
    }
  }

  private walkingRightBottom(): void {
    if (this.remainingWalkDistance > 0) {
      this.position.x += 1
      this.remainingWalkDistance--
    } else {
      this.selectAction()
    }
    if (this.position.x >= this.screenWidth - this.physicsConfig.petWidth) {
      this.state = 'climbingRightSidebarDownToUp'
    }
  }

  private climbingLeftSidebarDownToUp(): void {
    this.position.y -= 1

    if (!this.midpointCheckDone && this.position.y <= this.screenHeight / 2) {
      this.midpointCheckDone = true
      if (!this.shouldContinueClimbing()) {
        this.startFalling('right')
        return
      }
    }

    if (this.position.y <= 0) {
      this.state = 'climbingTopLeft'
      this.midpointCheckDone = false
    }
  }

  // ... 其他 climbing 方法类似 ...

  private falling(): void {
    this.velocity.y += this.physicsConfig.gravity
    this.velocity.y *= this.physicsConfig.damping
    this.position.y += this.velocity.y

    if (this.position.y >= this.landingY + 3) {
      if (!this.fallAnimationStarted) {
        this.frame = 1
        this.fallAnimationStarted = true
        this.position.y = this.landingY + 3
      }

      if (this.frame < this.animConfig.fall.frames.length + 1) {
        if (this.frame >= 1 && this.frame <= 3) {
          this.position.y -= this.velocity.y
          this.moveDuration = 140
        } else if (this.frame === 4) {
          this.position.y -= this.velocity.y
          this.moveDuration = 600
        } else {
          this.frameDuration = 200
          this.moveDuration = 12
        }
        this.frame++
      }
    }

    if (this.frame >= this.animConfig.fall.frames.length + 1) {
      this.position.y = this.landingY

      if (this.nextState !== 'idle') {
        this.state = this.nextState
        this.nextState = 'idle'
      } else {
        this.selectAction()
      }

      this.fallAnimationStarted = false
      this.frameDuration = 200
      this.moveDuration = 12
    }
  }

  private selectAction(): void {
    const randomValue = Math.random()

    if (randomValue < 0.2) {
      this.selectIdleAction()
    } else if (randomValue < 0.5) {
      this.selectSpecialAction()
    } else {
      this.selectRandomWalk()
    }
  }

  private selectRandomWalk(): void {
    const walkDirection = Math.random() < 0.5 ? 'walkingRightBottom' : 'walkingLeftBottom'
    this.remainingWalkDistance = this.calculateWalkDistance()
    this.state = walkDirection as PetState
    this.frame = 0
  }

  private selectSpecialAction(): void {
    const specialActions = Array.from(this.animConfig.special.keys())
    if (specialActions.length > 0) {
      this.currentSpecialAction = specialActions[Math.floor(Math.random() * specialActions.length)]
      const config = this.animConfig.special.get(this.currentSpecialAction)!
      this.specialActionLoopEndOnly = config.loopEndOnly || false
      this.specialActionLoopCount = 0
      this.state = 'specialAction'
      this.frame = 0
    }
  }

  private selectIdleAction(): void {
    const idleActions = Array.from(this.animConfig.idle.keys())
    if (idleActions.length > 0) {
      this.currentIdleAction = idleActions[Math.floor(Math.random() * idleActions.length)]
      this.idleActionLoopCount = 0
      this.state = 'idleAction'
      this.frame = 0
    }
  }

  private calculateWalkDistance(): number {
    return Math.floor(Math.random() * (this.screenWidth / 6)) + Math.floor(this.screenWidth / 6)
  }

  private shouldContinueClimbing(): boolean {
    return Math.random() < 0.5
  }

  private startFalling(direction: string): void {
    this.state = 'falling'
    this.velocity = { x: 0, y: 0 }
    this.fallAnimationStarted = false
    this.frame = 0
    this.midpointCheckDone = false

    this.remainingWalkDistance = this.calculateWalkDistance()

    if (direction === 'left') {
      this.nextState = 'walkingLeftBottom'
    } else if (direction === 'right') {
      this.nextState = 'walkingRightBottom'
    } else {
      const dir = Math.random() < 0.5 ? 'left' : 'right'
      this.nextState = dir === 'left' ? 'walkingLeftBottom' : 'walkingRightBottom'
    }
  }

  // Getters
  getPosition(): { x: number; y: number } {
    return { ...this.position }
  }

  getState(): PetState {
    return this.state
  }

  setPosition(x: number, y: number): void {
    this.position = { x, y }
  }

  setState(state: PetState): void {
    this.state = state
    this.frame = 0
  }

  // 更新宠物情感状态（来自 IPC）
  updateEmotion(emotion: string): void {
    if (emotion === 'happy') {
      this.selectRandomWalk()
    } else if (emotion === 'sad') {
      this.selectIdleAction()
    } else if (emotion === 'celebrate') {
      this.selectSpecialAction()
    }
  }
}
```

---

## 二、React Hook 集成

### 文件：`src/renderer/pet-window/src/hooks/usePetAnimationEngine.ts`

```typescript
import { useEffect, useRef, useState } from 'react'
import { PetAnimationEngine, PetAnimationConfig, PhysicsConfig } from '../animation/PetAnimationEngine'

export function usePetAnimationEngine(
  animConfig: PetAnimationConfig,
  screenWidth: number,
  screenHeight: number
) {
  const engineRef = useRef<PetAnimationEngine | null>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [transform, setTransform] = useState('rotate(0deg)')
  const animFrameRef = useRef<number | null>(null)

  const physicsConfig: PhysicsConfig = {
    gravity: 0.1,
    damping: 0.98,
    petWidth: 100,
    petHeight: 100
  }

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new PetAnimationEngine(
        animConfig,
        physicsConfig,
        screenWidth,
        screenHeight
      )
    }

    const engine = engineRef.current

    const animate = (currentTime: number) => {
      engine.updateFrame(currentTime)
      engine.updatePosition(currentTime)

      setCurrentFrame((prev) => prev + 1) // 触发重新渲染
      setPosition(engine.getPosition())
      setTransform(engine.getTransform())

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [animConfig, screenWidth, screenHeight])

  return {
    engine: engineRef.current,
    currentFrameImage: engineRef.current?.getCurrentFrameImage() || '',
    position,
    transform,
    currentFrame
  }
}
```

---

## 三、集成到现有组件

### 文件：`src/renderer/pet-window/src/components/CatSpriteAnimated.tsx`

```typescript
import type { PetRendererProps } from '../types'
import { usePetAnimationEngine } from '../hooks/usePetAnimationEngine'
import { PERSONALITY_CONFIGS } from '../personality'

export function CatSpriteAnimated({
  pet,
  emotion,
  onClick,
  proactiveText,
  masterActive = false
}: PetRendererProps) {
  const config = PERSONALITY_CONFIGS[pet.personality]
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  const { currentFrameImage, position, transform } = usePetAnimationEngine(
    config.animationConfig,
    screenWidth,
    screenHeight
  )

  return (
    <div className="relative w-full h-full">
      {/* 主动行为气泡 */}
      {proactiveText ? (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full">
          <div
            className="rounded-token-lg bg-white/80 px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-float backdrop-blur-md"
            style={{ color: 'var(--ink-700)' }}
          >
            {proactiveText}
          </div>
          <div
            className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-white/80 backdrop-blur-md"
            aria-hidden
          />
        </div>
      ) : null}

      {/* 名字气泡 */}
      <span className="pointer-events-none relative z-10 inline-flex max-w-[120px] items-center truncate rounded-full border border-white/70 bg-white/95 px-4 py-2 text-sm font-black text-[#2c2118] shadow-lg backdrop-blur">
        <span
          className="mr-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: config.color }}
          aria-hidden
        />
        <span className="truncate">{pet.name}</span>
      </span>

      {/* 大师激活脉冲 */}
      {masterActive ? (
        <span
          className="pointer-events-none absolute bottom-0 left-1/2 z-0 h-20 w-20 -translate-x-1/2 translate-y-5 rounded-full animate-master-pulse"
          style={{
            backgroundColor: 'var(--accent-current-medium)',
            boxShadow: '0 0 24px var(--accent-current-medium)'
          }}
          aria-hidden
        />
      ) : null}

      {/* 动画宠物 */}
      <button
        id="cat-sprite"
        className="no-drag group relative grid h-[100px] w-[100px] cursor-pointer place-items-center border-0 bg-transparent p-0"
        onClick={onClick}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          bottom: `${window.innerHeight - position.y - 100}px`,
          ['--accent-current' as string]: config.color
        }}
      >
        <img
          src={currentFrameImage}
          alt={config.displayName}
          className="pointer-events-none h-full w-full object-contain drop-shadow-xl"
          style={{
            transform: transform,
            transition: 'transform 0.3s ease-in-out'
          }}
          draggable={false}
        />
      </button>

      {/* 阴影光晕 */}
      <span
        className="pointer-events-none absolute bottom-0 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full opacity-25 blur-md"
        style={{ backgroundColor: config.color }}
        aria-hidden
      />
    </div>
  )
}
```

---

## 四、personality.ts 配置扩展

### 文件：`src/renderer/pet-window/src/personality.ts`

```typescript
import { PetAnimationConfig } from './animation/PetAnimationEngine'

export interface PersonalityConfig {
  displayName: string
  color: string
  spritePath: string // 保留用于兼容
  animationConfig: PetAnimationConfig // 新增
}

export const PERSONALITY_CONFIGS: Record<string, PersonalityConfig> = {
  scholar: {
    displayName: '学者猫',
    color: '#8B4513',
    spritePath: '/cats/scholar.png',
    animationConfig: {
      walk: {
        frames: [
          { imagePath: '/cats/scholar/walk1.png', duration: 200 },
          { imagePath: '/cats/scholar/walk2.png', duration: 200 },
          { imagePath: '/cats/scholar/walk3.png', duration: 200 },
          { imagePath: '/cats/scholar/walk4.png', duration: 200 }
        ]
      },
      climb: {
        frames: [
          { imagePath: '/cats/scholar/climb1.png', duration: 150 },
          { imagePath: '/cats/scholar/climb2.png', duration: 150 },
          { imagePath: '/cats/scholar/climb3.png', duration: 150 }
        ]
      },
      fall: {
        frames: [
          { imagePath: '/cats/scholar/fall1.png', duration: 100 },
          { imagePath: '/cats/scholar/fall2.png', duration: 100 },
          { imagePath: '/cats/scholar/fall3.png', duration: 100 },
          { imagePath: '/cats/scholar/fall4.png', duration: 100 },
          { imagePath: '/cats/scholar/fall5.png', duration: 100 }
        ]
      },
      drag: {
        frames: [
          { imagePath: '/cats/scholar/drag1.png', duration: 150 },
          { imagePath: '/cats/scholar/drag2.png', duration: 150 }
        ]
      },
      special: new Map([
        ['celebrate', {
          frames: [
            { imagePath: '/cats/scholar/special_celebrate1.png', duration: 150 },
            { imagePath: '/cats/scholar/special_celebrate2.png', duration: 150 },
            { imagePath: '/cats/scholar/special_celebrate3.png', duration: 150 }
          ],
          loop: true,
          loopTimes: 3
        }],
        ['paw_wave', {
          frames: [
            { imagePath: '/cats/scholar/special_wave1.png', duration: 100 },
            { imagePath: '/cats/scholar/special_wave2.png', duration: 100 },
            { imagePath: '/cats/scholar/special_wave3.png', duration: 100 },
            { imagePath: '/cats/scholar/special_wave4.png', duration: 100 }
          ],
          loop: true,
          loopTimes: 2
        }]
      ]),
      idle: new Map([
        ['sitting', {
          frames: [
            { imagePath: '/cats/scholar/idle_sit.png', duration: 500 }
          ],
          loop: true,
          loopTimes: 10
        }],
        ['thinking', {
          frames: [
            { imagePath: '/cats/scholar/idle_think1.png', duration: 300 },
            { imagePath: '/cats/scholar/idle_think2.png', duration: 300 }
          ],
          loop: true,
          loopTimes: 8
        }]
      ])
    }
  }
  // ... 其他角色配置
}
```

---

## 五、关键集成清单

### ✅ 需要调整的现有文件

| 文件 | 改动说明 |
|------|--------|
| `App.tsx` | 添加情感状态变更时触发 `engine.updateEmotion()` |
| `petWindow.ts` | 窗口尺寸应调整为全屏 (screenWidth × screenHeight) |
| `personality.ts` | 扩展为包含 `animationConfig` 配置 |
| `PetRenderer.tsx` | 支持条件渲染 (sprite vs animated) |
| `styles.css` | 添加 transform 过渡动画 |

### ✅ 新增文件

| 路径 | 说明 |
|------|------|
| `animation/PetAnimationEngine.ts` | 核心动画引擎 |
| `hooks/usePetAnimationEngine.ts` | React Hook 包装 |
| `components/CatSpriteAnimated.tsx` | 新组件 |
| `animation/types.ts` | TypeScript 类型定义 |

---

## 六、迁移步骤

### Step 1: 准备精灵表资源
```
public/cats/
  ├── scholar/
  │   ├── walk1.png ... walk4.png
  │   ├── climb1.png ... climb3.png
  │   ├── fall1.png ... fall5.png
  │   ├── drag1.png, drag2.png
  │   ├── special_celebrate1.png ... celebrate3.png
  │   ├── special_wave1.png ... wave4.png
  │   ├── idle_sit.png
  │   ├── idle_think1.png, idle_think2.png
  │   └── (其他角色类似)
```

### Step 2: 实现核心引擎（1 天）
- 复制 `PetAnimationEngine.ts` 到项目
- 完成所有状态转移逻辑
- 单元测试状态机

### Step 3: React 集成（1 天）
- 实现 `usePetAnimationEngine` Hook
- 创建 `CatSpriteAnimated.tsx` 组件
- 验证动画循环

### Step 4: 配置迁移（0.5 天）
- 更新 `personality.ts` 为所有宠物
- 调整 petWindow 窗口大小

### Step 5: 交互集成（1 天）
- 添加鼠标穿透逻辑
- 实现拖拽交互
- 集成对话气泡

### Step 6: 测试优化（1 天）
- 性能分析
- 动画帧率优化
- 跨平台测试

---

## 七、预计工作量

| 阶段 | 时间 | 输出 |
|------|------|------|
| 核心引擎开发 | 3-4 天 | 完整的动画系统 |
| React 集成 | 2-3 天 | 可用的组件 |
| 配置整理 | 1-2 天 | 所有宠物配置 |
| 测试优化 | 2-3 天 | 生产就绪代码 |
| **总计** | **8-12 天** | **可交付版本** |

