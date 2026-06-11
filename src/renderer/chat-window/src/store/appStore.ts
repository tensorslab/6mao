import { create } from 'zustand'

/** 半山喵事处 · 六位喵掌事角色标识 */
export type CharacterId = 'scholar' | 'tea' | 'mechanic' | 'messenger' | 'student' | 'artist'

/** 角色主色映射（与 character-style-guide.md / personality.ts 保持一致） */
export const CHARACTER_COLORS: Record<CharacterId, string> = {
  scholar: '#4F3E30', // ink-700 · 喵掌柜（主理 · 账房）
  tea: '#D67A3E', // kaki-500 · 阿白（茶艺 · 招待）
  mechanic: '#7A8B6B', // pine-500 · 阿铁（器物 · 修补）
  messenger: '#D67A3E', // kaki-500 · 小橘（跑堂 · 通信）
  student: '#A8B8C5', // mist-500 · 玄墨（查书 · 检索）
  artist: '#E8A4A4' // sakura-500 · 阿染（作画 · 创意）
}

/** 角色头像图片映射（与 public/cats/*.png 保持一致） */
export const CHARACTER_AVATARS: Record<CharacterId, string> = {
  scholar: '/cats/scholar.png',
  tea: '/cats/tea.png',
  mechanic: '/cats/mechanic.png',
  messenger: '/cats/messenger.png',
  student: '/cats/student.png',
  artist: '/cats/artist.png'
}

/** 头像加载失败时的回退占位图 */
export const CHARACTER_AVATAR_FALLBACK = '/cats/placeholder-cat.svg'

/** 模板 → 喵掌事角色映射（用于领养与列表展示） */
export interface CharacterProfile {
  characterId: CharacterId
  name: string
  title: string
  props: string
}

export const TEMPLATE_TO_CHARACTER: Record<string, CharacterProfile> = {
  balanced: { characterId: 'scholar', name: '11', title: '喵掌柜', props: '算盘、卷宗、深蓝小袄' },
  tsundere: { characterId: 'tea', name: '阿白', title: '茶艺·招待', props: '草帽、红绳、陶土小茶壶' },
  clingy: { characterId: 'messenger', name: '小橘', title: '跑堂·通信', props: '粉绸蝴蝶结、托盘、茶杯' },
  social: { characterId: 'artist', name: '阿染', title: '作画·创意', props: '樱枝、画笔、调色板' },
  philosopher: { characterId: 'student', name: '玄墨', title: '查书·检索', props: '圆框眼镜、卷轴、砚台' },
  mischievous: { characterId: 'mechanic', name: '阿铁', title: '器物·修补', props: '蓝围裙、红格方巾、扳手' },
  lazy: { characterId: 'tea', name: '阿白', title: '茶艺·招待', props: '草帽、红绳、陶土小茶壶' }
}

/** 兼容旧版 cat-* 前缀模板 ID → 新模板键 */
const LEGACY_TEMPLATE_ALIAS: Record<string, string> = {
  'cat-default': 'balanced',
  'cat-tsundere': 'tsundere',
  'cat-clingy': 'clingy',
  'cat-social': 'social',
  'cat-philosopher': 'philosopher',
  'cat-mischief': 'mischievous',
  'cat-lazy': 'lazy'
}

/** 根据 template / personality 字段解析对应角色信息，未命中时回退到 scholar */
export function resolveCharacterProfile(template?: string | null): CharacterProfile {
  if (!template) return TEMPLATE_TO_CHARACTER.balanced
  const normalized = LEGACY_TEMPLATE_ALIAS[template] ?? template
  return TEMPLATE_TO_CHARACTER[normalized] ?? TEMPLATE_TO_CHARACTER.balanced
}

interface AppStore {
  currentPetId: string
  ownerId: string
  currentCharacterId: CharacterId
  setCurrentPetId: (petId: string) => void
  setCurrentCharacterId: (characterId: CharacterId) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentPetId: 'demo-cat',
  ownerId: import.meta.env.VITE_OWNER_ID ?? 'local-owner',
  currentCharacterId: 'scholar',
  setCurrentPetId: (petId) => set({ currentPetId: petId }),
  setCurrentCharacterId: (characterId) => set({ currentCharacterId: characterId })
}))
