import type { ElectronAPI } from '../../preload/renderer'

export function installElectronApiFallback(): void {
  if (window.electronAPI) return

  const noopUnsubscribe = (): void => {}

  window.electronAPI = {
    openChat: (petId: string) => {
      console.info('[6mao preview] openChat', petId)
    },
    closeChat: () => {
      console.info('[6mao preview] closeChat')
    },
    setIgnoreMouse: () => {},
    startPetDrag: () => {},
    movePetDrag: () => {},
    endPetDrag: () => {},
    resumePetMotion: () => {},
    notifyPetEmotion: (emotion) => {
      console.info('[6mao preview] pet emotion', emotion)
    },
    notifyPetAction: (action) => {
      console.info('[6mao preview] pet action', action)
    },
    setCurrentPet: (pet) => {
      console.info('[6mao preview] current pet', pet)
    },
    onPetSwitch: () => noopUnsubscribe,
    onCurrentPet: () => noopUnsubscribe,
    onPetEmotion: () => noopUnsubscribe,
    onPetAction: () => noopUnsubscribe,
    onPetProactive: () => noopUnsubscribe
  } satisfies ElectronAPI
}
