# 桌面宠物动画系统快速参考

## 1 分钟速览

### Convai 项目亮点
- **精灵表动画**：每个动作用 3-6 张PNG逐帧切换（vs 现在的静态1张）
- **物理模拟**：宠物会掉落、反弹、可被拖拽（vs 现在固定位置）
- **11 态状态机**：walk → climb → fall → idle/special (vs 现在只有 idle+bounce)
- **全屏漫游**：可到达屏幕任何位置，攀爬四条边（vs 现在固定右下角）
- **智能气泡**：根据位置自动调整气泡方向（vs 现在固定向上）

### 核心参考架构
```
请求框架 (Electron)
    ↓
全屏透明窗口 (screenWidth × screenHeight)
    ↓
单一 DOM 元素 (#pet)
    ↓
背景图 + 位置更新 (requestAnimationFrame)
    ↓
状态机驱动 (11 个状态)
    ↓
精灵表配置 (characters.json)
```

---

## 快速对标

### 问题 → 参考方案

| 需求 | Convai 怎么做 | 6mao 可以... |
|------|-------------|-----------|
| 动作多样性 | JSON 配置 special_actions | 扩展 personality.ts |
| 平滑移动 | 每 12ms 更新位置 | 用 requestAnimationFrame |
| 物理反馈 | velocity += gravity, damping | 复用算法 |
| 拖拽交互 | mousedown/mousemove/mouseup | 添加到现有 handler |
| 气泡定位 | 4 向智能避让 | 学习位置计算 |

---

## 关键代码片段

### 动画循环（核心）
```javascript
// Convai: 时间驱动的帧更新
function updatePet(currentTime) {
    // 帧更新（200ms 一次）
    if (currentTime - lastFrameTime > 200) {
        frame = (frame + 1) % frames.length
        pet.style.backgroundImage = `url('${frames[frame]}')`
        lastFrameTime = currentTime
    }
    
    // 位置更新（12ms 一次）
    if (currentTime - lastMoveTime > 12) {
        updatePosition()  // 状态机驱动
        lastMoveTime = currentTime
    }
    
    requestAnimationFrame(updatePet)
}
```

### 状态转移（关键）
```javascript
// Convai: 显式状态机
switch (state) {
    case 'walking':
        position.x += 1
        if (position.x >= screenWidth) {
            state = 'climbing'  // 触发转移
        }
        break
    case 'climbing':
        position.y -= 1
        if (position.y <= 0) {
            state = 'falling'   // 连锁转移
        }
        break
    case 'falling':
        velocity.y += gravity   // 物理模拟
        position.y += velocity.y
        if (position.y >= groundLevel) {
            selectAction()      // 随机选择下一步
        }
        break
}
```

### 精灵表配置（灵活）
```json
{
  "scholar": {
    "walk_max_frame": 4,
    "special_actions": {
      "celebrate": {
        "max_frames": 3,
        "loop": true,
        "loop_times": 3
      }
    }
  }
}
```

---

## 复用度评估

| 组件 | 复用度 | 改造量 |
|------|--------|--------|
| 状态机逻辑 | 95% | ⬇️ 低（直接复用） |
| 物理算法 | 90% | ⬇️ 低（参数调整） |
| 动画循环 | 85% | ⬇️ 中（React 绑定） |
| 气泡系统 | 70% | ⬇️ 中-高（重新设计） |
| UI 代码 | 40% | ⬆️ 高（完全重写） |
| **平均** | **76%** | **中等** |

---

## 实现路线图

```
Week 1
├─ Day 1: 核心引擎实现（PetAnimationEngine）
├─ Day 2: React Hook 包装（usePetAnimationEngine）
├─ Day 3: 集成到 petWindow
└─ Day 4: 基础动作测试

Week 2
├─ Day 1: 拖拽交互
├─ Day 2: 气泡跟踪
├─ Day 3: 连接状态指示
└─ Day 4: 性能优化 + 测试

预计产出：生产就绪的动画系统 ✅
```

---

## 直接可用的代码

### 文件列表
- `/tmp/pet_full.js` - Convai 完整源码（933 行）
- `/tmp/research_report.md` - 详细研究报告
- `/tmp/implementation_guide.md` - TypeScript 实现指南
- `/tmp/technical-comparison.md` - 对比分析

### 快速启动
1. 阅读 `research_report.md` 了解整体设计
2. 参考 `implementation_guide.md` 的 TypeScript 代码框架
3. 查看 `technical-comparison.md` 评估改造范围

---

## 常见问题

### Q: 需要全部 200+ 张精灵图吗？
**A**: 不需要。可以先用最小集合：
- walk (3-4 张)
- fall (3-4 张)
- idle (2-3 张)
= 总共 8-10 张就能演示核心功能

### Q: 性能会不会很差？
**A**: 不会。Convai 的实现很高效：
- requestAnimationFrame 60 FPS
- 实际帧更新 200ms（1/3 帧率）
- 位置更新 12ms（每帧 5 次）
- 单一 DOM 元素，无复杂选择器

### Q: 怎样集成到现有 IPC 系统？
**A**: 引擎是独立的：
```typescript
engine.updateEmotion(emotion)  // 来自 IPC
engine.setState(newState)       // 响应事件
```

### Q: 能支持 Live2D 吗？
**A**: 可以。引擎返回的是位置+状态，渲染器可替换：
```typescript
interface IPetRenderer {
    render(engine: PetAnimationEngine): ReactNode
}
// 实现多个：SpriteRenderer, Live2DRenderer, PixiRenderer
```

---

## 立即行动清单

- [ ] 阅读 research_report.md（30 min）
- [ ] 查看 Convai 源码 pet.js（30 min）
- [ ] 评估精灵表资源（1 day）
- [ ] 建立项目里程碑（1 day）
- [ ] 开始 Phase 1 核心引擎（3-4 day）

---

## 联系参考

**Convai Desktop Pet**
- GitHub: https://github.com/AkshitIreddy/convai-desktop-pet
- 版本: v1.1.0
- 依赖: Electron 33.2.1, ConvAI SDK 0.1.4

**参考文件位置**
- 全部分析文档: `/Users/miaoy/Downloads/6mao/docs/`
- 完整源码备份: `/tmp/pet_full.js`

