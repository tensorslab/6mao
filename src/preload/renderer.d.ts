import type {
  PetEmotion,
  PetProactivePayload,
  MasterStartPayload,
  MasterDonePayload,
  MasterArtifactPayload,
  DaemonStatusPayload
} from '../shared/ipc-channels'

export interface ElectronAPI {
  // 窗口控制
  openChat: (petId: string) => void
  closeChat: () => void
  setIgnoreMouse: (ignore: boolean) => void

  // 宠物控制
  notifyPetEmotion: (emotion: PetEmotion) => void
  setCurrentPet: (pet: { petId: string; name: string }) => void

  // 宠物事件订阅
  onPetSwitch: (callback: (petId: string) => void) => () => void
  onCurrentPet: (callback: (pet: { petId: string; name: string }) => void) => () => void
  onPetEmotion: (callback: (emotion: PetEmotion) => void) => () => void

  // 主动行为
  onPetProactive: (callback: (payload: PetProactivePayload) => void) => () => void

  // 喵大师事件
  onMasterStart: (callback: (payload: MasterStartPayload) => void) => () => void
  onMasterDone: (callback: (payload: MasterDonePayload) => void) => () => void
  onMasterArtifact: (callback: (payload: MasterArtifactPayload) => void) => () => void

  // Daemon 状态查询
  getDaemonStatus: () => Promise<DaemonStatusPayload>
  getDaemonPort: () => Promise<number>

  // 偏好设置
  updatePreferences: (key: string, value: unknown) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
