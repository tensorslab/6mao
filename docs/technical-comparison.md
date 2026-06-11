# 6mao 现有架构 vs Convai 参考实现对比分析

## 一、当前 6mao 桌宠架构

### 渲染方式
```typescript
// 现状：静态 PNG 图片 + CSS 动画
<img
  src={config.spritePath}  // /cats/scholar.png (单张大图)
  className="... animate-[bounce_0.8s_ease-in-out_infinite]"
/>
```

**特点**：
- ✅ 实现简单，5 行代码
- ❌ 缺乏动作多样性
- ❌ 无法实现复杂动画
- ❌ bounce 动画不自然

### 窗口配置
```typescript
// 现状：小固定窗口（150×92）
const petWindow = new BrowserWindow({
  width: 150,
  height: 92,
  x: workArea.x + workArea.width - width - 32,
  y: workArea.y + workArea.height - height - 32,
  transparent: true,
  frame: false,
  alwaysOnTop: true,
  setIgnoreMouseEvents(true, { forward: true })
})
```

**特点**：
- ✅ 置顶小窗口，不抢焦点
- ❌ 固定右下角位置
- ❌ 无法自由移动
- ❌ 不能攀爬屏幕边框

### 交互方式
```typescript
// 现状：仅点击打开聊天
<button onClick={openChat}>
  {proactiveText && <气泡>}
</button>
```

**特点**：
- ✅ 简洁直观
- ❌ 无拖拽
- ❌ 无气泡自动追踪
- ❌ 无连接状态指示

---

## 二、Convai 参考实现

### 渲染方式
```javascript
// 参考：精灵表动画 + 帧切换
const walkFrames = Array.from(
  { length: 3 }, 
  (_, i) => `assets/ayaka/walk${i + 1}.png`
);

// 每 200ms 切换一帧
pet.style.backgroundImage = `url('${walkFrames[frame]}')`;
```

**特点**：
- ✅ 流畅的逐帧动画
- ✅ 支持 10+ 种动作
- ✅ 物理模拟（重力、阻尼）
- ✅ 高度可配置

### 窗口配置
```javascript
// 参考：全屏透明窗口 + DOM 定位
const petWindow = new BrowserWindow({
  width: screenWidth,
  height: screenHeight,  // 全屏！
  transparent: true,
  frame: false,
  alwaysOnTop: true,
  focusable: false,
  x: 0,
  y: 0
});

petWindow.setIgnoreMouseEvents(true, { forward: true });
```

**特点**：
- ✅ 宠物可到达屏幕任何位置
- ✅ 攀爬四条边框
- ✅ 可自由漫游
- ✅ 内存占用低（单一透明容器）

### 交互方式
```javascript
// 参考：拖拽 + 对话 + 状态追踪
pet.addEventListener("mousedown", (e) => {
  if (e.altKey) {
    // Alt+点击 → 打开对话框
    createTextBox();
  } else {
    // 普通点击 → 拖拽
    isDragging = true;
    onMouseMove → updatePosition → falling();
  }
});
```

**特点**：
- ✅ 拖拽反馈（气泡跟随）
- ✅ 复杂的对话 UI（输入框+提交+音频）
- ✅ 实时连接状态
- ✅ 音频流播放反馈

---

## 三、功能对比表

| 功能 | 6mao 现状 | Convai 实现 | 差距 |
|------|----------|-----------|------|
| **动画帧数** | 1 | 3-6 | ⬆️ 3-6 倍 |
| **动作种类** | 2 (idle, bounce) | 11 (walk/climb/fall/drag/idle/special) | ⬆️ 5.5 倍 |
| **物理模拟** | ❌ | ✅ (重力+阻尼) | ⬆️ 完全缺失 |
| **自由移动** | ❌ (固定位置) | ✅ (全屏漫游) | ⬆️ 关键功能 |
| **拖拽交互** | ❌ | ✅ | ⬆️ 缺失 |
| **气泡跟踪** | 部分 | ✅ (4 向智能定位) | ⬆️ 不完善 |
| **连接状态** | ❌ | ⚠️ (可添加) | ⬆️ 缺失 |
| **支持宠物数** | 1 | 多 (通过 petWindow.Map) | ⬆️ 可拓展 |
| **配置灵活性** | 硬编码 | JSON 配置 | ⬆️ 更灵活 |
| **代码行数** | ~150 | 933 | ⬇️ 复杂度高 |

---

## 四、技术债对比

### 6mao 当前架构的问题

```
❌ 封闭式设计
  └─ 新增动作需要修改代码
  └─ 难以复用到其他项目
  └─ 扩展性差

❌ 静态 UI
  └─ 气泡只在顶部显示
  └─ 无法智能避让屏幕边界
  └─ 用户体验受限

❌ 缺乏物理感
  └─ 没有重力模拟
  └─ 传送感强（直接出现在目标位置）
  └─ 不够生动

❌ 交互单一
  └─ 只能点击打开聊天
  └─ 无任何拖拽反馈
  └─ 不像真实宠物

❌ 性能无优化
  └─ 无缓存策略
  └─ 无帧率控制
  └─ 高分屏上可能卡顿
```

### Convai 架构的问题

```
⚠️ 代码风格
  └─ 使用 JavaScript（无类型检查）
  └─ nodeIntegration: true（安全风险）
  └─ 不符合 6mao 的 TypeScript 规范

⚠️ AI 集成
  └─ 依赖 Convai SDK（外部服务）
  └─ 6mao 使用本地 Gemma（不同架构）
  └─ 需要重新设计对接方式

⚠️ 性能考虑
  └─ 全屏窗口可能增加内存占用
  └─ requestAnimationFrame 无帧率限制
  └─ 长时间运行时可能内存泄漏
```

---

## 五、集成策略

### 方案 A：核心逻辑迁移（推荐）

**核心思想**：提取 Convai 的精灵表+状态机设计，用 TypeScript 重写

```
Convai 的优点              →  采纳
├─ 精灵表配置方式          →  使用
├─ 11 态状态机            →  复用
├─ 物理模拟算法            →  参考
└─ 帧时间控制方式          →  学习

Convai 的不足              →  改进
├─ JavaScript 代码         →  改为 TypeScript
├─ Convai SDK 集成         →  改为 Gemma WebSocket
├─ 全屏窗口                →  改为可配置大小
└─ 硬编码逻辑              →  改为配置驱动
```

**优势**：
- ✅ 获得核心动画能力
- ✅ 保持 6mao 的代码风格
- ✅ 完全可控
- ✅ 安全性更好

**成本**：8-12 天开发

---

### 方案 B：直接集成（不推荐）

**直接复用 Convai 的 pet.js**

**劣势**：
- ❌ JavaScript 混入 TypeScript 项目
- ❌ nodeIntegration 安全风险
- ❌ 难以维护
- ❌ 无法自定义

---

### 方案 C：渐进式改造（保险）

**阶段 1**（现在）：保持现状，文档研究
**阶段 2**（2 周）：实现核心动画引擎 + 基础动作
**阶段 3**（2 周）：添加拖拽 + 气泡
**阶段 4**（1 周）：连接状态指示 + 性能优化

---

## 六、资源需求

### 精灵表资源

Convai 使用资源结构：
```
assets/
  ├── ayaka/
  │   ├── walk1.png, walk2.png, walk3.png
  │   ├── climb1.png, climb2.png, climb3.png
  │   ├── fall1.png ... fall5.png
  │   ├── drag1.png ... drag6.png
  │   ├── special_action_1_1.png ... 1_3.png
  │   └── idle_action_1_1.png ... 2_1.png
  │
  └── [其他 8 个角色，每个 20+ 张]
```

**总计**：~200+ 张 PNG 图片

### 6mao 需要

6mao 当前只有 6 只水彩猫咪（单张静态图）：
```
public/cats/
  ├── artist.png
  ├── hero-shop.png
  ├── mechanic.png
  ├── messenger.png
  ├── scholar.png
  ├── student.png
  └── tea.png
```

**需要补充**：每只猫咪的分解动作帧

---

## 七、改造路线推荐

### 核心改造：动画引擎 TypeScript 化

```typescript
// 从 Convai 学到的设计模式
export class PetAnimationEngine {
  // 1. 状态机驱动
  state: PetState = 'falling'
  nextState: PetState = 'idle'
  
  // 2. 时间控制分离
  updateFrame(currentTime)  // 200ms 更新一次
  updatePosition(currentTime)  // 12ms 更新一次
  
  // 3. 配置驱动
  animConfig: PetAnimationConfig  // 外部注入
  physicsConfig: PhysicsConfig
  
  // 4. 物理模拟
  velocity: { x, y }
  gravity: number
  damping: number
}
```

### 最小化改造：当前基础上增强

如果时间紧张，可以只添加：
1. 多帧精灵表支持
2. 待机动作轮换
3. 气泡智能定位
4. 拖拽反馈

---

## 八、总结

### 关键发现

| 维度 | 6mao 现状 | 参考方案 | 建议 |
|------|----------|--------|------|
| **功能完整性** | 基础（50%） | 完整（95%） | 采纳 90%，过滤 5% |
| **代码质量** | 高（TS+React） | 中（JS+Vue-like） | 重写为 TS |
| **可维护性** | 高 | 中 | 改进后可高 |
| **扩展性** | 低 | 高 | 迁移后可高 |
| **性能** | 优（轻量） | 良（完整） | 平衡二者 |

### 最终建议

**采用方案 A（核心逻辑迁移）**

1. **参考 Convai 的架构设计**
   - 精灵表配置方案
   - 11 态状态机
   - 时间控制分离
   - 物理模拟算法

2. **用 TypeScript + React 重新实现**
   - 保持 6mao 的代码风格
   - 集成 Daemon 通信能力
   - 支持 Live2D 切换

3. **分阶段交付**
   - Phase 1：核心动画 + 基础动作
   - Phase 2：完整交互 + 状态展示
   - Phase 3：性能优化 + 增强体验

4. **预计投入：8-12 天**
   - 核心引擎：3-4 天
   - React 集成：2-3 天
   - 配置整理：1-2 天
   - 测试优化：2-3 天

### 风险评估

| 风险 | 概率 | 缓解方案 |
|------|------|--------|
| 精灵表资源不足 | 中 | 优先用部分动作上线 |
| 性能不达预期 | 低 | 使用 Canvas 备选方案 |
| IPC 通信延迟 | 低 | 本地缓存 + 预加载 |

