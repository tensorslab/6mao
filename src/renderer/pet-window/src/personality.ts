import type { CharacterConfig, CharacterId } from './types'
import { yellowCatAsset } from './assets/yellowCat'

/** 半山喵事处 · 六位喵掌事
 *  对应 character-style-guide.md 角色档案
 */
export const CHARACTER_CONFIGS: Record<CharacterId, CharacterConfig> = {
  scholar: {
    id: 'scholar',
    displayName: '11',
    title: '喵掌柜',
    colorVar: '--ink-700',
    color: '#4F3E30',
    prop: '算盘、卷宗、深蓝小袄',
    masterSkill: '主理 · 账房（统筹、调度、记账）',
    modelPath: '/models/scholar/scholar.model3.json',
    spritePath: yellowCatAsset.previewPath,
    spriteAsset: yellowCatAsset,
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 8000
  },
  tea: {
    id: 'tea',
    displayName: '阿白',
    title: '茶艺 · 招待',
    colorVar: '--kaki-500',
    color: '#D67A3E',
    prop: '草帽、红绳、陶土小茶壶',
    masterSkill: '茶艺 · 招待（开场、欢迎、安抚）',
    modelPath: '/models/tea/tea.model3.json',
    spritePath: yellowCatAsset.previewPath,
    spriteAsset: yellowCatAsset,
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 7000
  },
  mechanic: {
    id: 'mechanic',
    displayName: '阿铁',
    title: '器物 · 修补',
    colorVar: '--pine-500',
    color: '#7A8B6B',
    prop: '蓝围裙、红格方巾、扳手',
    masterSkill: '器物 · 修补（错误恢复、调试）',
    modelPath: '/models/mechanic/mechanic.model3.json',
    spritePath: yellowCatAsset.previewPath,
    spriteAsset: yellowCatAsset,
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 9500
  },
  messenger: {
    id: 'messenger',
    displayName: '小橘',
    title: '跑堂 · 通信',
    colorVar: '--kaki-500',
    color: '#D67A3E',
    prop: '粉绸蝴蝶结、托盘、茶杯',
    masterSkill: '跑堂 · 通信（推送、提醒、IM）',
    modelPath: '/models/messenger/messenger.model3.json',
    spritePath: yellowCatAsset.previewPath,
    spriteAsset: yellowCatAsset,
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 5500
  },
  student: {
    id: 'student',
    displayName: '玄墨',
    title: '查书 · 检索',
    colorVar: '--mist-500',
    color: '#A8B8C5',
    prop: '圆框眼镜、卷轴、砚台',
    masterSkill: '查书 · 检索（搜索、读文档）',
    modelPath: '/models/student/student.model3.json',
    spritePath: yellowCatAsset.previewPath,
    spriteAsset: yellowCatAsset,
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 7500
  },
  artist: {
    id: 'artist',
    displayName: '阿染',
    title: '作画 · 创意',
    colorVar: '--sakura-500',
    color: '#E8A4A4',
    prop: '樱枝、画笔、调色板',
    masterSkill: '作画 · 创意（图像、文案）',
    modelPath: '/models/artist/artist.model3.json',
    spritePath: yellowCatAsset.previewPath,
    spriteAsset: yellowCatAsset,
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 6500
  }
}

/** 向后兼容别名 */
export const PERSONALITY_CONFIGS = CHARACTER_CONFIGS
