import type { PetEmotion, PetRenderMode } from '../../../shared/ipc-channels'

export type Personality = 'tsundere' | 'genki' | 'sleepy' | 'cool' | 'gentle'

export interface PetPersonalityConfig {
  id: Personality
  displayName: string
  modelPath: string
  spritePath: string
  idleMotion: string
  talkMotion: string
  idleInterval: number
  color: string
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
}
