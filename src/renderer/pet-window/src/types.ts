import type { PetEmotion, PetRenderMode } from '../../../shared/ipc-channels'

/** 六角色 ID — 与 character-style-guide.md 对应 */
export type CharacterId = 'scholar' | 'tea' | 'mechanic' | 'messenger' | 'student' | 'artist'

/** 向后兼容的 Personality 别名 */
export type Personality = CharacterId

export interface CharacterConfig {
  id: CharacterId
  displayName: string
  title: string
  /** 主点缀色 (CSS var name) */
  colorVar: string
  /** 主点缀色 hex */
  color: string
  /** 道具/配饰描述 */
  prop: string
  /** 对应的大师能力 */
  masterSkill: string
  /** Live2D 模型路径 */
  modelPath: string
  /** 精灵图路径（备用） */
  spritePath: string
  /** 空闲动画名 */
  idleMotion: string
  /** 说话动画名 */
  talkMotion: string
  /** 随机动作触发间隔 ms */
  idleInterval: number
}

export interface RenderPet {
  id: string
  name: string
  personality: Personality
}

export interface PetRendererProps {
  pet: RenderPet
  emotion: PetEmotion
  mode: PetRenderMode
  onClick: () => void
  /** 主动行为提示文案（如提醒、问候）— 存在时在猫咪上方展示气泡 */
  proactiveText?: string | null
  /** 大师能力激活态 — 触发猫咪外圈脉冲光环 */
  masterActive?: boolean
}
