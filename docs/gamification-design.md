# 6mao 游戏化产品设计文档

**产品名称**：《半山喵事处》  
**项目代号**：6mao  
**文档版本**：v1.0  
**更新日期**：2026年6月11日

---

## 目录

1. [产品愿景](#产品愿景)
2. [竞品对标分析](#竞品对标分析)
3. [游戏化设计方案](#游戏化设计方案)
4. [与L1/L2架构的结合](#与l1l2架构的结合)
5. [MVP优先级和路线图](#mvp优先级和路线图)
6. [技术实现要点](#技术实现要点)
7. [风险和注意事项](#风险和注意事项)

---

## 产品愿景

### 核心定位

**6mao** 是一款"松弛陪伴型"AI猫咪桌面宠物应用，品牌 IP 为《半山喵事处》——一个江南古镇茶馆场景，六位各具特色的猫咪角色在这里各司其职。核心体验是：

- **低操作压力**：与传统游戏的高反馈驱动不同，6mao 强调"被陪伴感"而非"成就感"
- **高情感价值**：通过角色性格、记忆、成长建立深层连接，而非数值堆砌
- **渐进式惊喜**：用户与猫咪的互动越深，获得的反馈越丰富、越个性化

### 游戏化目标

游戏化改造的目标是在保留"松弛陪伴"核心的前提下，通过以下机制提升**用户粘性**和**情感投入**：

1. **增强代入感**：让用户感受到"我在照料一个真实的伙伴"，而非对话框
2. **创造期待**：设计"不确定的小惊喜"（随机事件、成长阶段、发现新互动）
3. **建立成就感**：提供轻量、低压的目标系统，让用户体验"我让ta更好了"
4. **延伸社交**：通过分享、访客等机制，在松弛社交中拓展用户关系

### 差异化定位

| 维度 | 旅行青蛙 | 星布谷地 | neko atsume | **6mao** |
|------|---------|---------|------------|---------|
| 核心体验 | 放置+收集 | AI社交+轻游戏 | 猫咪养成+收集 | **陪伴+成长+发现** |
| 操作频率 | 极低（日1-2次） | 中高（日多次） | 中等（日多次） | **低频率（日1-3次）** |
| 角色深度 | 单一生物 | AI NPC有记忆 | 多猫无记忆 | **6角色体系+个性化记忆** |
| 社交能力 | 无社交 | 核心玩法 | 弱社交 | **可选社交+分享** |
| AI赋能 | 无 | 核心驱动 | 无 | **L1日常+L2技能混搭** |
| 情感触发 | 惊喜+思念 | 被需要感 | 收集欲 | **记忆感+陪伴感+意外惊喜** |

---

## 竞品对标分析

### 1. 旅行青蛙（Tabikaeru）

#### 核心机制

- **放置系统**：玩家准备食物 → 青蛙自主出发旅行 → 随机周期返回
- **收集系统**：带回明信片（随机风景+文字）、手信（装饰品）
- **访客系统**：其他动物来院子做客，玩家可用食物招待换礼物
- **极低操作成本**：离线进度自动推进，不惩罚不离线玩家

#### 成功因素

- ✨ **不确定性**：每次出行都可能带回什么是未知的，激发期待
- ✨ **思念感**：青蛙离开时有离别感，回归时有惊喜感
- ✨ **防沉迷设计**：操作少→不强制高频→保持新鲜感
- ✨ **社交分享**：用户爱分享明信片内容，产生了UGC传播

#### 对6mao的借鉴

- 可用"外出探险"来抽象"主动行为"概念
- 收集系统可以映射为"记忆碎片""手信""风景照"
- 随机奖励机制可激发日返率

---

### 2. 星布谷地（Starling）

#### 核心机制

- **AI NPC社交**：每个NPC都有记忆、性格、偏好，与用户建立长期关系
- **轻量小游戏**：成语接龙、故事汤、梗力收购等降低社交门槛
- **被需要感**：通过"邀请参加活动"、"寻求建议"等机制让用户感受价值
- **异步互动**：支持离线消息，减轻实时压力

#### 成功因素

- ✨ **高频正反馈**：每个互动都有反应，都有小奖励
- ✨ **AI个性化**：每次对话都不同，感受到真实的"另一个人"
- ✨ **成就感设计**：小游戏有赢/输，拉升情感波澜
- ✨ **社交缓冲**：AI降低了真人社交压力，形成"松弛社交"

#### 对6mao的借鉴

- L1/L2 AI 能力可以驱动"智能小游戏"（如讲故事、猜谜、接龙）
- 可建立"偏好系统"：记录用户与猫咪的互动倾向，输出个性化反馈
- 异步行为推送（Daemon主动推送）适合低频设计

---

### 3. Neko Atsume（猫咪后院）

#### 核心机制

- **多猫养成**：多只猫咪各有外形、习性、喜好
- **道具收集**：放置食物→吸引特定猫咪→收集照片和玩具
- **相册系统**：记录每只猫的互动、拍照、收集完成度
- **无故事线**：纯粹收集导向，猫咪无个性差异

#### 成功因素

- ✨ **角色多样性**：多猫满足不同审美需求
- ✨ **收集完成度**：提供清晰的进度条，让用户有目标感
- ✨ **视觉反馈**：拍照、动画丰富，吸引频繁检查
- ✨ **付费优化**：道具商城自然，不强制但充分诱导

#### 对6mao的借鉴

- 6个角色体系天然适合"多猫收集"概念
- 可建立"图鉴"系统：记录每只猫的互动里程碑、照片、回忆片段
- 利用Sprite/Live2D的视觉丰富度，做好拍照分享

---

## 游戏化设计方案

### A. 放置探险系统（类旅行青蛙）

#### 设计概述

猫咪会根据其角色设定，自主外出执行任务/探险，带回"手信"和"记忆碎片"。

| 角色 | 外出身份 | 可能带回物品 | 代表行为 |
|------|---------|-----------|---------|
| **Scholar（喵掌柜）** | 行商办账 | 珍稀账簿、古玩、契约文书 | 调查/谈判 |
| **Tea（阿白）** | 云游品茶 | 茶叶、茶具、地方特产、明信片 | 品鉴/旅游 |
| **Mechanic（阿铁）** | 修补出诊 | 零件、工具、修复成果照片 | 维修/改造 |
| **Messenger（小橘）** | 跑堂送信 | 信件、礼物、沿途见闻 | 传递/连接 |
| **Student（玄墨）** | 查阅访学 | 孤本、拓本、知识笔记 | 学习/发现 |
| **Artist（阿染）** | 采风作画 | 画作、素描稿、采风地照片 | 创意/表达 |

#### 交互流程

```
[用户选择猫咪] 
    ↓
[预告出行计划] → 显示预计回归时间（1小时~1天）
    ↓
[猫咪离开] → petWindow 显示"离开中"动画，chat窗口可看"出行日志"
    ↓
[定时推送] → Daemon每2-4小时推送一条"前线报告"
    ↓
[随机回归] → 回归时间有±30%浮动，制造不确定性
    ↓
[收获展示] → 专属UI 展示收获物品、合照、日记片段
    ↓
[放入收藏库] → 物品进入"探险收集图鉴"
```

#### 核心机制细节

**1. 出行触发条件**
- 主动式：用户点击"派出探险"按钮，选择地点和目标
- 被动式：Daemon 根据猫咪 mood/energy 主动建议出行
- 冷却机制：同一猫咪出行间隔 ≥2小时，防止刷屏

**2. 行程长度随机化**
```
基础时长 = 根据目标类型 (30min~8h)
浮动比例 = ±30% 随机
最终时长 = 基础 × (0.7 ~ 1.3)
推送频次 = ceil(总时长 / 2h)
```

**3. 收获物品体系**
- **道具**（50%）：角色专属、有收藏价值的小物件
- **记忆碎片**（30%）：含有故事文字的卡片，可组成长故事
- **照片**（15%）：猫咪的"旅途自拍"，每张都有随机滤镜和地点标签
- **稀有掉落**（5%）：每周1-2次"幸运物品"，如限定版画册、签名信件

**4. 出行日志系统**
- 每个推送都含有"前线报告"：简短的故事片段，体现猫咪的冒险经历
- 例：`[2h后] "阿铁在山寨里发现了一口古钟，正在仔细调试..."|[4h后] "成功了！运回了一口会唱歌的古钟"`
- 日志可被用户"点赞"或"评论"（增强参与感）

#### 与L1/L2的结合

- **L1 日志生成**：端侧小模型实时生成"前线报告"，支持离线
- **L2 故事深化**（可选）：用户可花费"互动点"唤起"喵大师讲述完整故事"，获得高质量长文本
- **情绪映射**：根据adventure难度 → mood_delta，高难度探险有负面情绪消耗

---

### B. 收集图鉴系统

#### 设计概述

为出行获得的物品、照片、记忆碎片建立图鉴，提供"收集完成度"的快感。

#### 图鉴分类

**1. 道具图鉴**
- 按角色分组，每个角色40-60件独特道具
- 完成度显示：进度条 + 百分比
- 稀有度标签：普通 (灰) / 精良 (蓝) / 稀有 (紫) / 传说 (金)
- 详情页：物品名、描述、获取时间、获取来源地

**2. 照片图鉴**
- 按角色分组，每只猫200+ 潜在照片
- 随机滤镜 + 地点标签：每张照片都不同
- 相册模式：可制作"猫咪的一天"幻灯片分享
- 评价功能：用户可给照片"打星"、添加备注

**3. 记忆碎片**
- 单个碎片显示为"卡牌"样式
- 可组成完整故事：集齐同一系列5张碎片 → 解锁"完整故事"篇章
- 例：`[旅途见闻·茶馆街] 碎片1→2→3→4→5 → "阿白在茶馆街的奇遇"`

**4. 签到/纪念日**
- 每次探险回归都计入"与猫咪的回忆"
- 特殊纪念日（如adoption日期）自动标记
- 生成"与[猫咪名]相处[X天]"的时间线

#### UI/UX 设计要点

- **主视图**：grid或list展示，支持筛选（按角色/稀有度/获取时间）
- **详情页**：横屏查看，支持放大、分享
- **统计面板**：总收集数、完成度百分比、"最爱物品"等统计

#### 与L1/L2的结合

- **L1 物品描述生成**：端侧模型根据出行地点和道具生成简短描述
- **L2 故事续写**（付费）：用户可付费请"喵大师"展开某个记忆碎片的完整故事

---

### C. AI 互动小游戏系统

#### 设计概述

利用L1/L2能力，创造轻量、低门槛的互动游戏，增加日活和粘性。

#### 小游戏类别

**1. 讲故事（Story Telling）**

| 机制 | 说明 |
|------|------|
| **规则** | 用户提供"开头关键词"，猫咪讲3-5分钟故事 |
| **难度** | 简单（童话）/ 中等（奇幻）/ 难（推理）|
| **奖励** | 完成1个故事 +1点"互动值"，可换取图鉴解锁道具 |
| **冷却** | 1天3次免费，超次数需花互动值 |
| **AI实现** | L1生成主体，L2支持"续写"高难度故事 |

**2. 猜谜游戏（Riddle Master）**

| 机制 | 说明 |
|------|------|
| **规则** | 猫咪出谜语（5选1），用户猜答案 |
| **难度** | 简单（灯谜）/ 中等（脑筋急转弯）/ 难（逻辑谜题） |
| **奖励** | 连续答对3道 +5互动值；答错无惩罚 |
| **冷却** | 1天5题免费 |
| **AI实现** | L1生成谜题，自动判题；L2生成解谜说教 |

**3. 词语接龙（Word Chain）**

| 机制 | 说明 |
|------|------|
| **规则** | 用户出词，猫咪接词（同音、同部首、成语接龙等模式可选） |
| **难度** | 随用户连胜自动升级 |
| **奖励** | 连胜数作积分，排行榜展示 |
| **冷却** | 无限制，但每天首次通关有额外奖励 |
| **AI实现** | L1判词合法性+接词；L2生成"你知道吗"的词源知识 |

**4. 猫咪问答（Personality Quiz）**

| 机制 | 说明 |
|------|------|
| **规则** | 猫咪提出4选1问题，涵盖性格、知识、价值观 |
| **难度** | 根据猫咪个性动态调整问题难度 |
| **奖励** | 答对+互动值；持续玩可解锁"猫咪的秘密" |
| **冷却** | 1天10题免费 |
| **AI实现** | L1生成题目和答案解析；L2可生成"根据你的答案，我更了解你了..." 的深度回应 |

#### 小游戏的进度和成就系统

```
互动值(Interaction Points)
├─ 每日可获得上限：50点（防止刷屏）
├─ 用途：
│  ├─ 解锁"高级故事"（20点）
│  ├─ 加速出行回归（10点 = 缩短1小时）
│  └─ 进度值换道具（100点 = 1个指定稀有道具）
└─ 每周清零

成就系统
├─ 故事大师：完成100个故事 → 解锁特殊角色互动语音
├─ 谜题破解者：连续答对50题 → 解锁"谜题大全"图鉴页
├─ 词汇宗师：连胜100+ → 解锁与Scholar(喵掌柜)的特殊对话
└─ 好奇心奖章：完成所有小游戏类型 → 猫咪赠送特殊道具
```

#### 与L1/L2的结合

- **L1 实时游戏驱动**：所有游戏逻辑在端侧执行，支持离线
- **L2 高级模式**：
  - 用户可支付"互动值"或"真实货币"解锁"喵大师讲座"
  - 例：`[故事深化] 用户讲完故事后，可选"请喵大师改编成诗歌版本"` → 云端调用L2生成高质量内容
  - 此时触发 `master_start` → `master_done` 事件，petWindow显示脉冲光环

---

### D. 成长进化系统（Bond 阶段解锁）

#### 设计概述

与现有 Bond（羁绊值）系统深度结合，创造"成长的里程碑"。

#### 现有 Bond 系统回顾

```
Bond Score (0~100)
├─ Stage 1 (0-20): 初识
├─ Stage 2 (21-40): 熟悉
├─ Stage 3 (41-60): 亲近
├─ Stage 4 (61-80): 深交
└─ Stage 5 (81-100): 灵魂伙伴
```

#### 游戏化扩展：每个阶段的解锁奖励

| Bond Stage | 解锁内容 | 触发方式 | 示例 |
|-----------|---------|--------|------|
| **初识 (1-20)** | 基础外观解锁 | 自动 | 猫咪穿上"初来乍到"的衣服 |
| **熟悉 (21-40)** | 第一个角色主题故事 | 阅读首个完整记忆碎片组 | 解锁"[角色]初入茶馆"5章故事 |
| **亲近 (41-60)** | 新的互动动画 + Emote表情 | 累计互动100次 | 猫咪增加特殊问候动作、表情包 |
| **深交 (61-80)** | 角色专属技能解锁 | 完成该角色专属小游戏20次 | Scholar获得"智库查询"技能，可快速搜索往期对话 |
| **灵魂伙伴 (81-100)** | 终极外观 + 私密故事 + VIP特权 | 自动 | 猫咪获得"灵魂共鸣"外观、可看8000字私密日记 |

#### 外观进化系统

```
初始形象（Sprite/Live2D基础）
    ↓ [Bond 20→] 
衣着配件更新（根据故事背景）
    ↓ [Bond 40→]
气质升级（姿态、光效变化）
    ↓ [Bond 60→]
个性化装扮（用户可选择收集到的配件组合）
    ↓ [Bond 80→]
灵魂共鸣形态（全新Live2D/Sprite，背景光效，特殊音效）
```

#### 技能解锁系统

**Scholar 技能树**
- Lv1: 快速搜索（回顾往期对话，1周内免费3次）
- Lv2: 知识整理（生成对话摘要，付费功能）
- Lv3: 智库顾问（L2模式：长文本回答，高质量）

**Tea 技能树**
- Lv1: 品鉴笔记（自动记录用户偏好，推荐特定对话主题）
- Lv2: 招待魅力（增加探险获得道具的数量）
- Lv3: 云游导师（L2模式：讲述地理/文化故事）

**Mechanic 技能树**
- Lv1: 维修工坊（修复损坏的道具，点缀UI用）
- Lv2: 改造大师（合成低阶道具成高阶版本）
- Lv3: 创意工程（L2模式：自定义猫咪的道具或外观）

...（以此类推，每个角色6-8个技能）

#### 与L1/L2的结合

- **L1 动态内容生成**：根据Bond Stage和角色，L1生成相应难度和风格的对话回应
- **L2 里程碑故事**：每个Bond阶段解锁时，可选择"唤起喵大师讲述成长故事"，获得1000+字的高质量叙事

---

### E. 访客和社交系统（可选Phase 2+）

#### 设计概述

引入"其他角色来访"或"好友的猫来访"机制，延伸社交维度。

#### 子方案A：NPC角色来访

```
原理：定期有其他5个角色中的某个来到当前猫咪的"场景"，产生互动

触发机制：
- Daemon 定期（每3-6小时）随机选择一个未来访过的角色
- 生成来访理由：借工具、请教、闲聊等
- 产生"来访事件"，petWindow 增加第二个角色Sprite

互动流程：
[来访通知] → [用户选择招待方式：提供茶水/道具/对话] → [获得见闻+好感] → [离开]

奖励：
- 见闻道具：可收集"访客见闻录"
- 人设拓展：通过NPC间互动，了解角色间的"茶馆八卦"
- 社交感：产生"茶馆是个活生生的社区"的沉浸感
```

#### 子方案B：好友社交版本（仅当多玩家支持时）

```
前置条件：需要后端支持"玩家好友列表"和"猫咪分享"

机制：
1. 用户可以邀请好友注册6mao
2. 双方成为"茶馆好友"后，彼此的猫咪可互相来访
3. 来访时可带"礼物"（用户自选的过往收集到的道具）
4. 接收方获得"来自好友的礼物"，可留言感谢

UI/UX：
- 访客列表：显示"今日谁来过"
- 赠礼界面：从图鉴中选择要送出的道具，留下寄语
- 感谢互动：接收方可回赠道具或留言，形成"礼物往返"

好处：
- 增强社交粘性：好友互动触发日活
- 自然引流：分享邀请链接成为核心传播方式
- 减弱付费压力：用户通过社交获得更多资源而非充值
```

#### 与L1/L2的结合

- **L1 访客对话**：来访时的"小闲聊"由L1生成，快速、自然
- **L2 故事碰撞**：如果用户接待来访，可选"请喵大师记述这次相遇"，获得两个角色互动的高质量故事

---

## 与L1/L2架构的结合

### 架构回顾

当前6mao的AI能力分为两层：

```
L1（端侧小脑）
├─ Gemma小模型，离线运行
├─ 日常对话、情绪反应、主动行为生成
├─ 快速、低延迟、轻量
└─ 位置：Daemon中主要驱动

L2（云端喵大师）
├─ 大模型（如Claude、GPT-4等）
├─ 复杂任务、长文本、创意生成
├─ 高质量、响应时间可容忍、付费或VIP限制
└─ 通过 Master API 触发，WebSocket推送结果
```

### 游戏化模块对应的AI驱动

| 模块 | L1驱动 | L2增强 | 实现位置 |
|------|--------|--------|---------|
| **放置探险** | 前线报告生成、日志文本、随机事件 | 故事深化（可选付费） | Daemon的action队列 + streamChat API |
| **收集图鉴** | 道具描述自动生成 | 记忆碎片的故事续写 | 后端存储 + 按需调用L2 |
| **小游戏** | 题目生成、实时判题、基础解析 | 高级讲解、成就解锁故事 | useStreamChat hook调用 L1 |
| **Bond解锁** | 阶段判断、动画触发、基础祝贺 | 成长故事讲述、角色深度解读 | Daemon状态推送 + master_start |
| **访客系统** | 来访对话、基础交互 | 复杂故事碰撞、角色互动故事 | WebSocket主动推送 + 可选L2调用 |

### 关键设计原则

**原则1：L1优先、L2增强**

```typescript
// 伪代码示例：前线报告生成

// 快速路径（L1）——总是可用
const report = L1.generateTravelLog({
  characterId: 'tea',
  progress: 0.5,  // 0-1 之间的进度
  seed: Math.random()
})
// 输出：实时、多样化、可离线

// 增强路径（L2）——用户手动触发
if (user.triggeredStoryDeepen) {
  const deepStory = await L2.master('deepenTravelStory', {
    baseLog: report,
    characterId: 'tea'
  })
  // 输出：800+字高质量故事，需等待
}
```

**原则2：Daemon主动推送驱动游戏化**

```typescript
// Daemon 定期（每2小时）检查
if (adventure.isActive && adventure.nextCheckpoint <= now) {
  // 1. L1 生成前线报告
  const checkpoint = L1.generateCheckpoint(adventure)
  
  // 2. 通过 WebSocket 主动推送到 Electron
  daemonWS.emit('/ws/desktop', {
    action: 'adventure_checkpoint',
    petId: adventure.petId,
    checkpoint: checkpoint,
    // 随机50%触发小事件
    event: Math.random() > 0.5 ? L1.generateRandomEvent() : null
  })
  
  // 3. Electron 接收后，petWindow 显示气泡或动画
  electronAPI.notifyAdventure(checkpoint)
}
```

**原则3：情绪系统联动**

```typescript
// 小游戏完成时
if (gameResult === 'win') {
  // 1. 心情变化
  const moodDelta = L1.calculateMoodDelta(gameType, difficulty)
  // story → +10 mood（放松）
  // riddle → +5 mood（小成就）
  
  // 2. Daemon 推送状态变更
  notifyPetStatusUpdate({ mood: pet.mood + moodDelta })
  
  // 3. petWindow 触发emotion反馈
  notifyPetEmotion('happy')
}
```

### 推荐API扩展

为了支持游戏化功能，后端API应扩展以下端点：

```typescript
// 放置探险
POST /api/adventures/{petId}/start
  body: { destination: string, difficulty: 'easy'|'medium'|'hard' }
  
GET /api/adventures/{petId}/current
  response: { status, progress, nextCheckpoint, lastReport }

POST /api/adventures/{petId}/complete
  response: { rewards: Item[], memories: Fragment[] }

// 小游戏
GET /api/games/{gameType}/question
  response: { id, content, options[], difficulty }

POST /api/games/{gameType}/answer
  body: { questionId, selectedIndex }
  response: { correct, explanation, points }

// Bond和成长
GET /api/pets/{petId}/bond
  response: { score, stage, nextRewardAt }

POST /api/pets/{petId}/skills
  response: { unlockedSkills: Skill[] }

// 收集图鉴
GET /api/pets/{petId}/inventory
  response: { items: Item[], photos: Photo[], fragments: Fragment[] }

GET /api/inventory/stats
  response: { totalItems, totalPhotos, completionPercentage }
```

---

## MVP优先级和路线图

### Phase 1（核心体验，第1个月）

**目标**：建立"陪伴+成长"的核心驱动

**模块**：
1. ✅ **Bond阶段进度条**（已有基础，仅需UI优化）
   - 展示当前Bond值和所处阶段
   - 每个阶段显示解锁预告
   
2. ✅ **情绪系统可视化**（已有10种emotion，仅需强化反馈）
   - 每日stats展示（mood/energy/boredom）
   - 通过对话+小游戏的实时mood变化反馈

3. ⭐ **讲故事小游戏**（最快能上线的L1游戏）
   - 用户输入关键词 → L1生成3-5分钟故事
   - 完成计数 → 换互动值
   - 实现难度：低（复用现有streamChat）
   - 预期日活提升：+30%（新增高频互动）

4. ⭐ **记忆收集基础版**
   - 每次对话后自动生成"记忆卡"（L1生成简短文本）
   - 展示为可收集的卡牌
   - 完成难度：中等（需后端存储设计）

### Phase 2（快乐倍增，第2-3个月）

**目标**：增加"期待和惊喜"的游戏化循环

**模块**：
1. ⭐ **放置探险系统**（核心玩法升级）
   - 实现"派出探险"→"随机周期回归"→"获得奖励"的完整闭环
   - Daemon主动推送前线报告（每2小时）
   - 实现难度：中高（涉及Daemon扩展、WebSocket推送、后端DB设计）
   - 预期粘性提升：+50%（日返率从30%→50%）

2. ⭐ **猜谜小游戏**（第二个L1游戏）
   - 题目库管理（初期500题）
   - L1生成答案判题逻辑
   - 连胜积分排行
   - 实现难度：低（题库管理为主）

3. ✅ **Bond解锁视觉反馈**
   - 升级到新阶段时触发特殊动画
   - 显示"新解锁"物品预告
   - 实现难度：低（主要是UI/动画）

4. 📊 **收集图鉴完整版**
   - 道具、照片、记忆碎片三大分类
   - 完成度统计、稀有度标签
   - 实现难度：中（数据结构设计+UI）

### Phase 3（社交和变现，第4-6个月）

**目标**：引入社交和付费承载点

**模块**：
1. ⭐ **访客系统**
   - NPC角色来访机制（简单版）
   - 实现难度：中（需扩展Daemon逻辑）
   - 变现点：可选"付费加速来访"或"付费邀请指定角色"

2. **好友社交**（仅当满足多玩家条件）
   - 邀请机制、好友列表
   - 礼物往返
   - 实现难度：高（需完整多人系统）

3. **高级小游戏**
   - 词语接龙（需要算法）
   - 性格问卷（需内容库）
   - 实现难度：中低

4. **L2付费增强**
   - 故事深化（20互动值 ≈ $1）
   - 成长故事讲述（100互动值 ≈ $5）
   - 预期ARPU：$3-5/月（非强制，尊重用户选择）

### Phase 4+（长期运营，第6个月+）

**内容更新驱动**：
- 定期新增道具、照片、故事素材
- 季节性活动（春节特别探险、夏日海滨等）
- 用户生成内容（UGC）分享、排行
- 角色扩展（可能新增NPC或新角色）

---

## 技术实现要点

### 1. 数据结构设计

#### 1.1 冒险系统

```typescript
// src/shared/adventure-types.ts

export interface Adventure {
  id: string
  petId: string
  ownerId: string
  characterId: CharacterId
  
  // 冒险配置
  destination: string              // 地点名
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedDuration: number        // 毫秒
  actualDuration?: number
  
  // 时间戳
  startedAt: number
  estimatedReturnAt: number
  actualReturnAt?: number
  
  // 推送检查点
  checkpoints: AdventureCheckpoint[]
  
  // 最终收获
  rewards?: AdventureRewards
  
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

export interface AdventureCheckpoint {
  timestamp: number
  progress: number              // 0-1
  report: string               // L1生成的前线报告
  event?: AdventureRandomEvent // 随机事件
}

export interface AdventureRandomEvent {
  type: 'discovery' | 'encounter' | 'obstacle' | 'surprise'
  description: string
  moodDelta: number            // 情绪变化
}

export interface AdventureRewards {
  items: Item[]                // 道具
  photos: Photo[]              // 照片
  fragments: MemoryFragment[]  // 记忆碎片
  bondDelta: number            // 羁绊值增加
}

export interface Item {
  id: string
  itemId: string               // 物品模板ID
  characterId: CharacterId
  name: string
  description: string          // L1生成
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  obtainedAt: number
  source: 'adventure' | 'game' | 'gift' | 'milestone'
}

export interface Photo {
  id: string
  petId: string
  timestamp: number
  location: string             // 探险地点
  filter: string               // 随机滤镜名
  description: string
  userRating?: number          // 用户评分 1-5
}

export interface MemoryFragment {
  id: string
  petId: string
  seriesId: string             // 同一系列故事的碎片共享seriesId
  sequenceNumber: number       // 该系列中的顺序
  content: string              // 故事片段
  obtainedAt: number
  
  // 当该系列5片集齐时
  seriesCompleted?: boolean
  fullStory?: string           // L1/L2合并生成的完整故事
}
```

#### 1.2 小游戏系统

```typescript
// src/shared/game-types.ts

export interface GameQuestion {
  id: string
  type: 'story' | 'riddle' | 'chain' | 'quiz'
  content: string
  difficulty: 'easy' | 'medium' | 'hard'
  
  // 故事类
  storyPrompt?: string         // 触发故事的关键词
  
  // 谜题类
  options?: string[]
  correctAnswer?: number | string
  explanation?: string
  
  // 词链类
  chainMode?: 'homophone' | 'radical' | 'idiom'
  
  // 问卷类
  questionText?: string
  
  generatedAt: number          // 由L1生成的时间
}

export interface GameProgress {
  userId: string
  gameType: string
  totalAttempts: number
  wins: number
  streak: number               // 连胜数
  lastPlayedAt: number
  
  dailyWins: number            // 当日完成数
  dailyRewards: number         // 当日获得互动值
}

export interface GameReward {
  interactionPoints: number
  bondDelta: number
  unlockedAchievement?: string
}
```

#### 1.3 Bond和成长系统

```typescript
// 扩展现有Pet类型

export interface Pet extends BasePet {
  // 现有字段...
  
  // Bond扩展
  bond: {
    score: number              // 0-100
    stage: BondStage           // 1-5
    lastUpdatedAt: number
    stageUnlockedAt?: {        // 各阶段解锁时间
      [key: number]: number
    }
  }
  
  // 解锁的技能和外观
  unlockedAppearances: string[] // 外观模板ID列表
  unlockedSkills: Skill[]
  currentAppearance?: string
  
  // 成长数据
  totalInteractionsCount: number
  gameWinsCount: { [gameType: string]: number }
  adventuresCount: number
  lastInteractionAt: number
}

export type BondStage = 1 | 2 | 3 | 4 | 5

export interface Skill {
  id: string
  characterId: CharacterId
  name: string
  description: string
  level: 1 | 2 | 3           // 每个技能最多3级
  unlockedAt: number
  cooldownMs?: number        // 某些技能有冷却时间
}

export const BOND_THRESHOLDS = {
  1: [0, 20],
  2: [21, 40],
  3: [41, 60],
  4: [61, 80],
  5: [81, 100]
} as const

export const BOND_UNLOCKS = {
  1: { appearance: 'initial', story: null },
  2: { appearance: 'familiar', story: 'origin_story' },
  3: { appearance: 'close', emotes: ['happy', 'thinking'], story: 'bonding_moment' },
  4: { appearance: 'intimate', skills: ['skill_1', 'skill_2'] },
  5: { appearance: 'soulmate', story: 'intimate_diary', skill: 'ultimate_skill' }
} as const
```

### 2. 前端组件变化

#### 2.1 新增UI组件

```
src/renderer/chat-window/src/components/
├─ GameBoard.tsx              // 小游戏面板
├─ GameCard.tsx               // 单个游戏卡片
├─ InventoryView.tsx          // 图鉴展示
├─ InventoryFilter.tsx        // 筛选器
├─ BondProgress.tsx           // Bond进度条
├─ UnlockNotification.tsx      // 解锁提示
└─ StatsPanel.tsx             // Stats展示（mood/energy/boredom）

src/renderer/pet-window/src/components/
├─ AdventureOverlay.tsx       // 冒险进行中的覆盖层
├─ CheckpointNotice.tsx       // 检查点推送通知
└─ SkillIndicator.tsx         // 技能激活指示
```

#### 2.2 现有组件增强

```typescript
// 增强 PetRenderer.tsx
export interface PetRendererProps {
  // 现有字段...
  
  // 新增字段
  currentAppearance?: string   // 当前外观ID
  skillActive?: boolean        // 是否激活技能（显示脉冲光环）
  adventureActive?: boolean    // 是否在冒险中（显示"离开"状态）
}

// 增强 CatSprite.tsx / CatLive2D.tsx
// - 支持多套外观切换
// - 支持自定义配件叠加（如帽子、围裙等）
// - 支持特殊光效（skill激活、Bond提升等）
```

#### 2.3 Store扩展

```typescript
// src/renderer/chat-window/src/store/gameStore.ts
export const useGameStore = create<GameStoreState>((set) => ({
  currentGameType: null,
  gameProgress: {},
  weeklyStats: {},
  setCurrentGame: (gameType) => set({ currentGameType: gameType }),
  updateProgress: (gameType, progress) => set(/* ... */),
  // ...
}))

// src/renderer/chat-window/src/store/adventureStore.ts
export const useAdventureStore = create<AdventureStoreState>((set) => ({
  activeAdventure: null,
  adventureHistory: [],
  checkpoints: [],
  startAdventure: async (petId, config) => { /* ... */ },
  receiveCheckpoint: (checkpoint) => set(/* ... */),
  completeAdventure: async () => { /* ... */ },
  // ...
}))

// 扩展现有 appStore.ts
useAppStore.subscribe(
  (state) => state.currentPetId,
  (petId) => {
    // 切换宠物时，自动加载其冒险和游戏进度
    adventureStore.loadAdventures(petId)
    gameStore.loadProgress(petId)
  }
)
```

### 3. Daemon和IPC扩展

#### 3.1 新增IPC通道

```typescript
// src/shared/ipc-channels.ts 扩展

export const IPC_CHANNELS_EXTENDED = {
  // 放置探险
  ADVENTURE_START: 'adventure:start',
  ADVENTURE_CHECKPOINT: 'adventure:checkpoint',
  ADVENTURE_COMPLETE: 'adventure:complete',
  
  // 小游戏
  GAME_QUESTION_REQUEST: 'game:question-request',
  GAME_SUBMIT_ANSWER: 'game:submit-answer',
  GAME_STATS_UPDATE: 'game:stats-update',
  
  // Bond和成长
  BOND_UPDATED: 'bond:updated',
  SKILL_UNLOCKED: 'skill:unlocked',
  APPEARANCE_UNLOCKED: 'appearance:unlocked',
  
  // 成就
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  
  // 访客系统
  VISITOR_ARRIVED: 'visitor:arrived',
  VISITOR_LEFT: 'visitor:left'
} as const
```

#### 3.2 Daemon扩展逻辑

```typescript
// src/main/daemon/index.ts 中的核心循环扩展

class DaemonCore {
  private adventureManager: AdventureManager
  private gameManager: GameManager
  
  async runMainLoop() {
    // 现有逻辑...
    
    // 新增：每2小时检查活跃冒险
    setInterval(() => this.checkAdventures(), 2 * 60 * 60 * 1000)
    
    // 新增：定期生成游戏题目缓存
    setInterval(() => this.preGenerateGameQuestions(), 60 * 60 * 1000)
    
    // 新增：检查Bond升级
    setInterval(() => this.checkBondUpgrades(), 10 * 60 * 1000)
    
    // 新增：定期访客事件
    setInterval(() => this.triggerVisitorEvents(), 3 * 60 * 60 * 1000)
  }
  
  private async checkAdventures() {
    const activeAdventures = await this.db.query(
      `SELECT * FROM adventures WHERE status = 'in_progress'`
    )
    
    for (const adventure of activeAdventures) {
      if (adventure.nextCheckpoint <= Date.now()) {
        // 1. L1生成前线报告
        const report = await this.l1.generateTravelLog(adventure)
        
        // 2. 推送到所有连接的客户端
        this.wsServer.broadcast('/ws/desktop', {
          action: 'adventure_checkpoint',
          petId: adventure.petId,
          checkpoint: {
            timestamp: Date.now(),
            progress: calculateProgress(adventure),
            report: report,
            event: Math.random() > 0.5 ? 
              await this.l1.generateRandomEvent(adventure) : null
          }
        })
        
        // 3. 更新nextCheckpoint
        adventure.nextCheckpoint = Date.now() + 2 * 60 * 60 * 1000
        await this.db.update('adventures', adventure)
        
        // 4. 检查是否回归
        if (adventure.actualReturnAt <= Date.now()) {
          await this.completeAdventure(adventure)
        }
      }
    }
  }
  
  private async completeAdventure(adventure: Adventure) {
    // 1. 生成奖励
    const rewards = await this.generateRewards(adventure)
    
    // 2. Bond值增加
    const bondDelta = this.calculateBondDelta(adventure.difficulty)
    
    // 3. 推送完成事件
    this.wsServer.broadcast('/ws/desktop', {
      action: 'adventure_complete',
      petId: adventure.petId,
      rewards: rewards,
      bondDelta: bondDelta
    })
    
    // 4. 更新数据库
    adventure.status = 'completed'
    adventure.rewards = rewards
    await this.db.update('adventures', adventure)
  }
}
```

#### 3.3 WebSocket消息格式扩展

```typescript
// src/main/daemon/desktop-ws.ts

interface DesktopWSMessage {
  action: string
  petId: string
  timestamp: number
  
  // 冒险相关
  checkpoint?: AdventureCheckpoint
  rewards?: AdventureRewards
  bondDelta?: number
  
  // 游戏相关
  gameQuestion?: GameQuestion
  gameResult?: { correct: boolean; reward: GameReward }
  
  // 成长相关
  newSkills?: Skill[]
  newAppearance?: string
  
  // 成就相关
  achievement?: { id: string; name: string; icon: string }
  
  // 访客相关
  visitor?: { characterId: CharacterId; reason: string }
}
```

### 4. 后端API设计（概览）

```typescript
// 核心端点（Daemon/后端需要暴露）

POST /api/adventures/start
  body: {
    petId: string
    destination: string
    difficulty: 'easy'|'medium'|'hard'
  }
  response: Adventure

GET /api/adventures/:adventureId

POST /api/adventures/:adventureId/checkpoint
  // Daemon 上报检查点
  body: AdventureCheckpoint
  response: { success: boolean }

POST /api/adventures/:adventureId/complete
  // Daemon 标记冒险完成
  body: { rewards: AdventureRewards }
  response: { bonded: true; newStage?: number }

---

GET /api/games/:gameType/question
  query: { difficulty?: string; seed?: number }
  response: GameQuestion

POST /api/games/question/:questionId/answer
  body: { userAnswer: string | number }
  response: {
    correct: boolean
    explanation: string
    reward: GameReward
  }

---

GET /api/pets/:petId/bond
  response: { score: number; stage: BondStage; unlocks: object }

GET /api/pets/:petId/inventory
  response: { items: Item[]; photos: Photo[]; fragments: MemoryFragment[] }

GET /api/pets/:petId/skills
  response: Skill[]

---

POST /api/visitors/trigger
  // Daemon 定期调用，触发来访事件
  body: { petId: string }
  response: { visitor: CharacterId; reason: string } | null
```

### 5. 性能考虑

- **L1模型缓存**：Daemon 启动时预加载Gemma模型，减少推理延迟
- **题目预生成**：游戏题目周期性生成，避免实时等待
- **冒险检查点异步处理**：不阻塞主事件循环
- **图鉴数据分页**：超过100件道具时，按分页加载
- **缓存策略**：
  - 题目库缓存1小时
  - 道具描述缓存永久（除非手动更新）
  - 用户进度缓存5分钟

---

## 风险和注意事项

### 1. 用户留存风险

**风险**：游戏化过度导致"氪金压力感"，违背"松弛陪伴"核心

**缓解措施**：
- 所有核心功能免费可用（不含付费内容）
- 付费项目仅为"增强体验"（L2故事、加速冒险等），非必需
- 透明展示"免费路径"和"付费加速路径"的对比
- 建议付费上限：月均$3-5/活跃用户（非强制）

### 2. 技术复杂度风险

**风险**：Daemon扩展过度，导致内存泄漏、CPU占用过高

**缓解措施**：
- Phase 1 仅做简单的Bond可视化和讲故事游戏（低复杂度）
- Phase 2 引入Daemon扩展，但严格控制定时任务数量（不超过5个）
- 定期profile Daemon进程，设置内存告警阈值
- 冒险和访客事件采用"最多N个同时活跃"的设计（如最多2个并发冒险）

### 3. 数据一致性风险

**风险**：Electron <-> Daemon <-> 后端的数据不同步（尤其在离线场景）

**缓解措施**：
- 采用"事件溯源"架构：所有状态变更都是幂等事件
- 离线时本地队列，联网后批量同步
- 后端做最终一致性检查（如Bond值异常校验）
- 关键操作（如Bond升级）需要双向确认

### 4. 内容陈旧风险

**风险**：初期内容量不足，导致玩家快速疲劳（如5周内用尽所有故事）

**缓解措施**：
- 题库初期设计：500题以上（不同难度、不同主题）
- 故事片段库：初期200+条记忆碎片组（每个角色30-40条系列）
- 道具库：每个角色初期60件以上
- 周期更新计划：每周新增20-30件内容（通过L1动态生成 + 手工精选）
- 建议与内容团队合作，提前规划3个月内容日历

### 5. AI生成质量风险

**风险**：L1生成的内容重复、低质，破坏沉浸感

**缓解措施**：
- 前期手工打磨L1提示词，建立"质量基线"
- 保留"手工精选"内容，混合自动生成
- 用户反馈机制：可以给生成内容打"赞/踩"，积累训练数据
- 关键内容（如Bond升级故事）保留L2高质量版本

### 6. 隐私和数据安全

**风险**：收集用户交互数据（游戏进度、冒险日志等）的隐私问题

**缓解措施**：
- 明确隐私政策：说明哪些数据被收集、如何使用
- 给用户导出/删除个人数据的权利
- 离线模式优先：最敏感的数据（如聊天记录）优先本地存储
- 可选匿名模式：支持"不上传进度"的纯本地玩法

---

## 附录A：游戏化机制对标表

| 机制 | 旅行青蛙 | 星布谷地 | Neko Atsume | **6mao** |
|------|---------|---------|-----------|---------|
| 核心驱动 | 离开+回归 | 高频互动 | 吸引特定猫 | 成长里程碑 |
| 日活触发点 | 检查青蛙(1-2次) | 小游戏(5-10次) | 检查院子(3-5次) | 冒险检查(2次) + 小游戏(3次) |
| 社交能力 | 分享明信片 | 内置社交 | 弱社交 | 可选分享+访客 |
| 变现方式 | 道具内购 | 无缝氪金 | 品种解锁 | L2增强功能 |
| 保留时间 | 3-6个月 | 1-3个月 | 6-12个月 | 目标12+ 个月 |
| 学习侧重 | 随机性和思念 | 高频反馈 | 收集完成度 | **角色记忆+成长** |

---

## 附录B：Phase 1 实现清单

**目标完成日期**：第1个月末

### 前端任务
- [ ] 增强BondProgress.tsx，展示当前Score和Stage
- [ ] 新增GameBoard.tsx框架（暂含讲故事、placeholder其他游戏）
- [ ] 新增InventoryView.tsx骨架（展示收集的记忆卡）
- [ ] 增强Stats展示：mood/energy/boredom实时面板
- [ ] 增强petWindow emotion反馈（已有，仅需强化视觉）

### 后端任务
- [ ] 设计Pet表结构扩展（bond, unlockedAppearances等字段）
- [ ] 新增MemoryFragment表和Item表
- [ ] 实现讲故事游戏的题目库（初期30-50条）
- [ ] 实现L1提示词优化（故事生成质量提升）
- [ ] 实现Bond升级时的事件推送

### Daemon任务
- [ ] 新增GameManager组件（管理游戏题目生成、答题判对）
- [ ] 增强Electron IPC，支持新的游戏通道

### QA和设计任务
- [ ] 游戏化UI设计稿（Bond进度、游戏卡片、库存展示）
- [ ] 讲故事题目库初期配置（30条示例）
- [ ] 记忆卡设计（卡牌样式、渐进解锁动画）

---

**本文档为游戏化设计方向指引，具体实现细节会根据开发过程迭代调整。**

