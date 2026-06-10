export const IPC_CHANNELS = {
  WINDOW_OPEN_CHAT: 'window:open-chat',
  WINDOW_CLOSE_CHAT: 'window:close-chat',
  WINDOW_SET_IGNORE_MOUSE: 'window:set-ignore-mouse',
  PET_SWITCH: 'pet:switch',
  PET_CURRENT: 'pet:current',
  PET_STATUS_UPDATE: 'pet:status-update',
  PET_EMOTION: 'pet:emotion'
} as const

export type PetEmotion = 'idle' | 'talk' | 'happy' | 'sad' | 'surprised'
export type PetRenderMode = 'sprite' | 'live2d'

export interface OpenChatPayload {
  petId: string
}

export interface PetSwitchPayload {
  petId: string
  name?: string
}

export interface PetCurrentPayload {
  petId: string
  name: string
}

export interface PetEmotionPayload {
  emotion: PetEmotion
}
