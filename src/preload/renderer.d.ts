import type { PetEmotion, PetProactivePayload } from '../shared/ipc-channels'

export interface ElectronAPI {
  openChat: (petId: string) => void
  closeChat: () => void
  setIgnoreMouse: (ignore: boolean) => void
  notifyPetEmotion: (emotion: PetEmotion) => void
  setCurrentPet: (pet: { petId: string; name: string }) => void
  onPetSwitch: (callback: (petId: string) => void) => () => void
  onCurrentPet: (callback: (pet: { petId: string; name: string }) => void) => () => void
  onPetEmotion: (callback: (emotion: PetEmotion) => void) => () => void
  onPetProactive: (callback: (payload: PetProactivePayload) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
