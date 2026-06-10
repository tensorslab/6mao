import type { PetPersonalityConfig, Personality } from './types'

export const PERSONALITY_CONFIGS: Record<Personality, PetPersonalityConfig> = {
  tsundere: {
    id: 'tsundere',
    displayName: '傲娇',
    modelPath: '/models/tsundere/tsundere.model3.json',
    spritePath: '/cats/placeholder-cat.svg',
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 8000,
    color: '#f07f61'
  },
  genki: {
    id: 'genki',
    displayName: '元气',
    modelPath: '/models/genki/genki.model3.json',
    spritePath: '/cats/placeholder-cat.svg',
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 5500,
    color: '#f4b860'
  },
  sleepy: {
    id: 'sleepy',
    displayName: '困困',
    modelPath: '/models/sleepy/sleepy.model3.json',
    spritePath: '/cats/placeholder-cat.svg',
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 11000,
    color: '#7abf9e'
  },
  cool: {
    id: 'cool',
    displayName: '酷酷',
    modelPath: '/models/cool/cool.model3.json',
    spritePath: '/cats/placeholder-cat.svg',
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 9500,
    color: '#667eea'
  },
  gentle: {
    id: 'gentle',
    displayName: '温柔',
    modelPath: '/models/gentle/gentle.model3.json',
    spritePath: '/cats/placeholder-cat.svg',
    idleMotion: 'idle',
    talkMotion: 'talk',
    idleInterval: 7000,
    color: '#d68ba3'
  }
}
