import type { ElectronAPI } from '../../preload/renderer'

export function installElectronApiFallback(): void {
  if (window.electronAPI) return

  const noopUnsubscribe = (): void => {}

  window.electronAPI = {
    // 窗口控制
    openChat: (petId: string) => {
      console.info('[6mao preview] openChat', petId)
    },
    closeChat: () => {
      console.info('[6mao preview] closeChat')
    },
    setIgnoreMouse: () => {},

    // 宠物控制
    notifyPetEmotion: (emotion) => {
      console.info('[6mao preview] pet emotion', emotion)
    },
    setCurrentPet: (pet) => {
      console.info('[6mao preview] current pet', pet)
    },

    // 宠物事件订阅
    onPetSwitch: () => noopUnsubscribe,
    onCurrentPet: () => noopUnsubscribe,
    onPetEmotion: () => noopUnsubscribe,

    // 主动行为
    onPetProactive: () => noopUnsubscribe,

    // 喵大师事件
    onMasterStart: () => noopUnsubscribe,
    onMasterDone: () => noopUnsubscribe,
    onMasterArtifact: () => noopUnsubscribe,

    // Daemon 状态查询
    getDaemonStatus: () => Promise.resolve({ status: 'stopped' as const }),
    getDaemonPort: () => Promise.resolve(8000),

    // 偏好设置
    updatePreferences: (key, value) => {
      console.info('[6mao preview] updatePreferences', key, value)
    }
  } satisfies ElectronAPI
}
