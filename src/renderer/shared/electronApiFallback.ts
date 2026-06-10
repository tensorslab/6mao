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
    notifyPetEmotion: (emotion) => {
      console.info('[6mao preview] pet emotion', emotion)
    },
    onPetSwitch: () => noopUnsubscribe,
    onPetEmotion: () => noopUnsubscribe
  } satisfies ElectronAPI
}
