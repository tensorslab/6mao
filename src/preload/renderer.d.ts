import type { PetEmotion } from '../shared/ipc-channels'

export interface ElectronAPI {
  openChat: (petId: string) => void
  closeChat: () => void
  setIgnoreMouse: (ignore: boolean) => void
  notifyPetEmotion: (emotion: PetEmotion) => void
  onPetSwitch: (callback: (petId: string) => void) => () => void
  onPetEmotion: (callback: (emotion: PetEmotion) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
