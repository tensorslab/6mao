/**
 * PetAnimationEngine
 * ------------------
 * 桌面宠物动画引擎核心：
 *   1. 状态机（idle / walk / drag / fall / emotion ...）
 *   2. 物理模拟（重力、阻尼、地面/边界）
 *   3. 行为调度（idle 随机决策、行走/睡眠时长控制）
 *   4. 事件回调（位置/状态/朝向变化）
 *
 * 设计原则：
 *   - 纯逻辑层，不依赖 DOM / React / Electron
 *   - 帧率无关，使用 deltaTime 推进
 *   - 输出通过回调函数触发，由上层渲染层消费
 */

/** 桌宠状态枚举 */
export type PetState =
  | 'idle' // 静止待机（有微动呼吸感，由渲染层处理）
  | 'walk_left' // 向左行走
  | 'walk_right' // 向右行走
  | 'fall' // 下落（被拖起后松开）
  | 'drag' // 被拖拽中
  | 'happy' // 开心（弹跳）
  | 'sad' // 难过
  | 'talk' // 说话中
  | 'sleep' // 睡觉
  | 'think' // 思考
  | 'special' // 特殊动作（大师激活等）

/** 情绪类状态（可由外部 setEmotion 触发） */
export type PetEmotionState = 'happy' | 'sad' | 'talk' | 'think' | 'special' | 'sleep'

/** 物理状态 */
export interface PhysicsState {
  /** 水平位置 (px) */
  x: number
  /** 垂直位置 (px, 0 = 地面，向上为正) */
  y: number
  /** 水平速度 (px/s) */
  vx: number
  /** 垂直速度 (px/s) */
  vy: number
  /** 重力加速度 (px/s²) */
  gravity: number
  /** 阻尼系数 (0~1) */
  damping: number
  /** 地面 Y 坐标 */
  groundY: number
}

/** 引擎事件回调 */
export interface PetEngineCallbacks {
  /** 位置变化（每帧触发） */
  onPositionChange: (x: number, y: number) => void
  /** 状态变化（仅在切换时触发） */
  onStateChange: (state: PetState, prevState: PetState) => void
  /** 朝向变化（左/右） */
  onDirectionChange: (facingLeft: boolean) => void
}

/** 引擎构造配置 */
export interface EngineConfig {
  /** 活动范围（窗口宽高） */
  bounds: { width: number; height: number }
  /** 行走速度（px/s），默认 60 */
  walkSpeed?: number
  /** 重力（px/s²），默认 800 */
  gravity?: number
  /** 阻尼系数，默认 0.95 */
  damping?: number
  /** idle 状态下随机决策间隔范围 [min, max] ms，默认 [3000, 8000] */
  idleInterval?: [number, number]
  /** 行走持续时长范围 [min, max] ms，默认 [2000, 5000] */
  walkDuration?: [number, number]
  /** 睡眠持续时长范围 [min, max] ms，默认 [10000, 20000] */
  sleepDuration?: [number, number]
  /** 情绪状态默认持续时长 ms，默认 2500 */
  emotionDuration?: number
  /** 初始位置（屏幕坐标 px）—— 缺省置于底部中央 */
  initialPosition?: { x: number; y: number }
  /** 事件回调 */
  callbacks: PetEngineCallbacks
}

/** 状态转换规则：每个状态允许跳转到的目标列表 */
const TRANSITIONS: Record<PetState, PetState[]> = {
  idle: ['walk_left', 'walk_right', 'sleep', 'happy', 'sad', 'talk', 'think', 'special', 'drag'],
  walk_left: ['idle', 'walk_right', 'drag', 'happy', 'sad', 'talk', 'think', 'special'],
  walk_right: ['idle', 'walk_left', 'drag', 'happy', 'sad', 'talk', 'think', 'special'],
  fall: ['idle', 'drag'],
  drag: ['fall', 'idle'],
  happy: ['idle'],
  sad: ['idle'],
  talk: ['idle'],
  sleep: ['idle', 'drag'],
  think: ['idle'],
  special: ['idle']
}

/** 情绪类状态白名单 */
const EMOTION_STATES: PetEmotionState[] = ['happy', 'sad', 'talk', 'think', 'special', 'sleep']

/** 区间内随机数 */
function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/** 区间内随机整数 */
function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1))
}

/**
 * 桌宠动画引擎
 */
export class PetAnimationEngine {
  // ===== 配置 =====
  private bounds: { width: number; height: number }
  private walkSpeed: number
  private idleInterval: [number, number]
  private walkDuration: [number, number]
  private sleepDuration: [number, number]
  private emotionDuration: number
  private callbacks: PetEngineCallbacks

  // ===== 状态 =====
  private state: PetState = 'idle'
  private physics: PhysicsState
  private facingLeft = false

  // ===== 时间管理 =====
  private rafId: number | null = null
  private lastFrameTime = 0
  /** 当前状态进入时间戳 */
  private stateEnterTime = 0
  /** 当前状态计划的持续时长（ms），0 表示无限 */
  private stateDuration = 0
  /** idle 下一次决策时间戳 */
  private nextIdleDecisionAt = 0

  // ===== 拖拽管理 =====
  private dragLastX = 0
  private dragLastY = 0
  private dragLastTime = 0
  /** 拖拽过程估算的释放速度 (px/s) */
  private dragVx = 0
  private dragVy = 0

  private destroyed = false

  constructor(config: EngineConfig) {
    this.bounds = { ...config.bounds }
    this.walkSpeed = config.walkSpeed ?? 60
    this.idleInterval = config.idleInterval ?? [3000, 8000]
    this.walkDuration = config.walkDuration ?? [2000, 5000]
    this.sleepDuration = config.sleepDuration ?? [10000, 20000]
    this.emotionDuration = config.emotionDuration ?? 2500
    this.callbacks = config.callbacks

    const initX = config.initialPosition?.x ?? this.bounds.width / 2
    const initY = config.initialPosition?.y ?? 0
    this.physics = {
      x: initX,
      y: initY,
      vx: 0,
      vy: 0,
      gravity: config.gravity ?? 800,
      damping: config.damping ?? 0.95,
      groundY: 0
    }
  }

  // ===================================================
  // 生命周期
  // ===================================================

  /** 启动引擎主循环 */
  start(): void {
    if (this.rafId !== null || this.destroyed) return
    this.lastFrameTime = performance.now()
    this.stateEnterTime = this.lastFrameTime
    this.scheduleNextIdleDecision(this.lastFrameTime)
    this.loop(this.lastFrameTime)
  }

  /** 停止引擎主循环（不销毁） */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /** 销毁引擎，释放所有资源 */
  destroy(): void {
    this.stop()
    this.destroyed = true
  }

  // ===================================================
  // 外部控制 API
  // ===================================================

  /**
   * 触发情绪/特殊状态。
   * 仅当目标为情绪类状态时生效，持续 emotionDuration 后自动回 idle。
   */
  setEmotion(emotion: PetState): void {
    if (this.destroyed) return
    if (!EMOTION_STATES.includes(emotion as PetEmotionState)) return
    if (this.state === 'drag' || this.state === 'fall') return

    const duration = emotion === 'sleep' ? randRange(...this.sleepDuration) : this.emotionDuration
    this.transitionTo(emotion, duration)
  }

  /** 开始拖拽：进入 drag 状态，停止物理模拟 */
  startDrag(x: number, y: number): void {
    if (this.destroyed) return
    this.physics.vx = 0
    this.physics.vy = 0
    this.dragLastX = x
    this.dragLastY = y
    this.dragLastTime = performance.now()
    this.dragVx = 0
    this.dragVy = 0
    this.setPosition(x, y)
    this.transitionTo('drag', 0)
  }

  /** 拖拽中更新位置，估算释放时的初速度 */
  updateDrag(x: number, y: number): void {
    if (this.destroyed) return
    if (this.state !== 'drag') return
    const now = performance.now()
    const dt = Math.max(1, now - this.dragLastTime) / 1000
    this.dragVx = (x - this.dragLastX) / dt
    this.dragVy = (y - this.dragLastY) / dt
    this.dragLastX = x
    this.dragLastY = y
    this.dragLastTime = now
    this.setPosition(x, y)
  }

  /** 结束拖拽：进入 fall，应用拖拽速度作为初速度 */
  endDrag(): void {
    if (this.destroyed) return
    if (this.state !== 'drag') return
    // 屏幕坐标系 y 向下为正，物理坐标系 y 向上为正：取反
    this.physics.vx = clamp(this.dragVx, -800, 800)
    this.physics.vy = clamp(-this.dragVy, -1200, 1200)
    this.transitionTo('fall', 0)
  }

  // ===================================================
  // 查询 API
  // ===================================================

  getState(): PetState {
    return this.state
  }

  getPosition(): { x: number; y: number } {
    return { x: this.physics.x, y: this.physics.y }
  }

  getFacingLeft(): boolean {
    return this.facingLeft
  }

  /** 更新活动范围（窗口尺寸变化时调用） */
  setBounds(width: number, height: number): void {
    this.bounds.width = width
    this.bounds.height = height
    // 夹紧当前位置
    this.physics.x = clamp(this.physics.x, 0, width)
    this.physics.y = Math.max(this.physics.y, this.physics.groundY)
  }

  // ===================================================
  // 内部：主循环
  // ===================================================

  private loop = (now: number): void => {
    if (this.destroyed) return
    const deltaMs = now - this.lastFrameTime
    const dt = Math.min(0.05, deltaMs / 1000) // 限制单帧 dt 上限，避免大跳
    this.lastFrameTime = now

    this.tick(dt, now)

    this.rafId = requestAnimationFrame(this.loop)
  }

  private tick(dt: number, now: number): void {
    switch (this.state) {
      case 'idle':
        this.tickIdle(now)
        break
      case 'walk_left':
      case 'walk_right':
        this.tickWalk(dt, now)
        break
      case 'fall':
        this.tickFall(dt)
        break
      case 'drag':
        // 位置由 updateDrag 直接驱动，引擎本帧不做物理推进
        break
      case 'happy':
        this.tickHappy(dt, now)
        break
      case 'sad':
      case 'talk':
      case 'think':
      case 'special':
        this.tickEmotion(now)
        break
      case 'sleep':
        this.tickSleep(now)
        break
    }
  }

  // ===================================================
  // 内部：各状态 tick
  // ===================================================

  private tickIdle(now: number): void {
    if (now >= this.nextIdleDecisionAt) {
      this.decideNextIdleAction(now)
    }
  }

  private tickWalk(dt: number, now: number): void {
    const dir = this.state === 'walk_left' ? -1 : 1
    this.physics.x += dir * this.walkSpeed * dt

    // 边界折返：到达边界则切换方向
    if (this.physics.x <= 0) {
      this.physics.x = 0
      this.transitionTo('walk_right', this.remainingDuration(now))
      this.updateFacing(false)
      return
    }
    if (this.physics.x >= this.bounds.width) {
      this.physics.x = this.bounds.width
      this.transitionTo('walk_left', this.remainingDuration(now))
      this.updateFacing(true)
      return
    }

    this.emitPosition()

    // 时间到回 idle
    if (this.stateDuration > 0 && now - this.stateEnterTime >= this.stateDuration) {
      this.transitionTo('idle', 0)
      this.scheduleNextIdleDecision(now)
    }
  }

  private tickFall(dt: number): void {
    // 物理模拟：重力 + 阻尼
    this.physics.vy -= this.physics.gravity * dt // y 向上为正，重力为负
    this.physics.vx *= this.physics.damping
    this.physics.x += this.physics.vx * dt
    this.physics.y += this.physics.vy * dt

    // 水平边界反弹
    if (this.physics.x < 0) {
      this.physics.x = 0
      this.physics.vx = -this.physics.vx * 0.5
    } else if (this.physics.x > this.bounds.width) {
      this.physics.x = this.bounds.width
      this.physics.vx = -this.physics.vx * 0.5
    }

    // 落地检测
    if (this.physics.y <= this.physics.groundY) {
      this.physics.y = this.physics.groundY
      this.physics.vy = 0
      this.physics.vx = 0
      this.emitPosition()
      this.transitionTo('idle', 0)
      this.scheduleNextIdleDecision(performance.now())
      return
    }

    this.emitPosition()
  }

  private tickHappy(dt: number, now: number): void {
    // 开心：原地小幅弹跳
    if (this.physics.y <= this.physics.groundY && this.physics.vy <= 0) {
      this.physics.y = this.physics.groundY
      this.physics.vy = 350 // 起跳
    }
    this.physics.vy -= this.physics.gravity * dt
    this.physics.y += this.physics.vy * dt
    if (this.physics.y < this.physics.groundY) {
      this.physics.y = this.physics.groundY
      this.physics.vy = 0
    }
    this.emitPosition()

    if (this.stateDuration > 0 && now - this.stateEnterTime >= this.stateDuration) {
      this.transitionTo('idle', 0)
      this.scheduleNextIdleDecision(now)
    }
  }

  private tickEmotion(now: number): void {
    if (this.stateDuration > 0 && now - this.stateEnterTime >= this.stateDuration) {
      this.transitionTo('idle', 0)
      this.scheduleNextIdleDecision(now)
    }
  }

  private tickSleep(now: number): void {
    if (this.stateDuration > 0 && now - this.stateEnterTime >= this.stateDuration) {
      this.transitionTo('idle', 0)
      this.scheduleNextIdleDecision(now)
    }
  }

  // ===================================================
  // 内部：行为决策
  // ===================================================

  private decideNextIdleAction(now: number): void {
    const r = Math.random()
    if (r < 0.45) {
      // 继续 idle，重新排期
      this.scheduleNextIdleDecision(now)
      return
    }
    if (r < 0.85) {
      // 行走
      const goLeft = Math.random() < 0.5
      const next: PetState = goLeft ? 'walk_left' : 'walk_right'
      const duration = randRange(...this.walkDuration)
      this.updateFacing(goLeft)
      this.transitionTo(next, duration)
      return
    }
    // 进入睡眠
    const sleepMs = randRange(...this.sleepDuration)
    this.transitionTo('sleep', sleepMs)
  }

  private scheduleNextIdleDecision(now: number): void {
    this.nextIdleDecisionAt = now + randInt(this.idleInterval[0], this.idleInterval[1])
  }

  // ===================================================
  // 内部：状态机/工具
  // ===================================================

  /** 安全切换状态，校验转换表 */
  private transitionTo(next: PetState, duration: number): void {
    if (next === this.state) {
      this.stateDuration = duration
      return
    }
    const allowed = TRANSITIONS[this.state]
    if (!allowed.includes(next)) {
      // 非法转换：忽略
      return
    }
    const prev = this.state
    this.state = next
    this.stateEnterTime = performance.now()
    this.stateDuration = duration

    // 状态进入副作用
    if (next === 'walk_left') this.updateFacing(true)
    else if (next === 'walk_right') this.updateFacing(false)

    this.callbacks.onStateChange(next, prev)
  }

  private updateFacing(left: boolean): void {
    if (this.facingLeft === left) return
    this.facingLeft = left
    this.callbacks.onDirectionChange(left)
  }

  private setPosition(x: number, y: number): void {
    this.physics.x = x
    this.physics.y = y
    this.emitPosition()
  }

  private emitPosition(): void {
    this.callbacks.onPositionChange(this.physics.x, this.physics.y)
  }

  /** 当前状态剩余时长（用于行走方向反转时延续计时） */
  private remainingDuration(now: number): number {
    if (this.stateDuration <= 0) return 0
    const elapsed = now - this.stateEnterTime
    return Math.max(0, this.stateDuration - elapsed)
  }
}

/** 数值夹紧 */
function clamp(v: number, min: number, max: number): number {
  if (v < min) return min
  if (v > max) return max
  return v
}

export default PetAnimationEngine
