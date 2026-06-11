import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC_CHANNELS,
  OpenChatPayload,
  PetCurrentPayload,
  PetEmotion,
  PetEmotionPayload,
  PetSwitchPayload,
  PetProactivePayload,
  MasterStartPayload,
  MasterDonePayload,
  MasterArtifactPayload,
  DaemonStatusPayload,
  PreferencesUpdatePayload
} from '../shared/ipc-channels'

const electronAPI = {
  // ── 窗口控制 ──
  openChat: (petId: string) =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_OPEN_CHAT, { petId } satisfies OpenChatPayload),
  closeChat: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE_CHAT),
  setIgnoreMouse: (ignore: boolean) =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_SET_IGNORE_MOUSE, ignore),

  // ── 宠物控制 ──
  notifyPetEmotion: (emotion: PetEmotion) =>
    ipcRenderer.send(IPC_CHANNELS.PET_EMOTION, { emotion } satisfies PetEmotionPayload),
  setCurrentPet: (pet: { petId: string; name: string }) =>
    ipcRenderer.send(IPC_CHANNELS.PET_CURRENT, pet satisfies PetCurrentPayload),

  // ── 宠物事件订阅 ──
  onPetSwitch: (callback: (petId: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PetSwitchPayload) => {
      callback(payload.petId)
    }
    ipcRenderer.on(IPC_CHANNELS.PET_SWITCH, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PET_SWITCH, listener)
  },
  onCurrentPet: (callback: (pet: { petId: string; name: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PetCurrentPayload) => {
      callback({ petId: payload.petId, name: payload.name })
    }
    ipcRenderer.on(IPC_CHANNELS.PET_CURRENT, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PET_CURRENT, listener)
  },
  onPetEmotion: (callback: (emotion: PetEmotion) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PetEmotionPayload) => {
      callback(payload.emotion)
    }
    ipcRenderer.on(IPC_CHANNELS.PET_EMOTION, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PET_EMOTION, listener)
  },

  // ── 主动行为（Daemon → 宠物卖萌/提醒） ──
  onPetProactive: (callback: (payload: PetProactivePayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PetProactivePayload) =>
      callback(payload)
    ipcRenderer.on(IPC_CHANNELS.PET_PROACTIVE, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PET_PROACTIVE, listener)
  },

  // ── 喵大师事件 ──
  onMasterStart: (callback: (payload: MasterStartPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: MasterStartPayload) =>
      callback(payload)
    ipcRenderer.on(IPC_CHANNELS.MASTER_START, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.MASTER_START, listener)
  },
  onMasterDone: (callback: (payload: MasterDonePayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: MasterDonePayload) =>
      callback(payload)
    ipcRenderer.on(IPC_CHANNELS.MASTER_DONE, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.MASTER_DONE, listener)
  },
  onMasterArtifact: (callback: (payload: MasterArtifactPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: MasterArtifactPayload) =>
      callback(payload)
    ipcRenderer.on(IPC_CHANNELS.MASTER_ARTIFACT, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.MASTER_ARTIFACT, listener)
  },

  // ── Daemon 状态查询 ──
  getDaemonStatus: (): Promise<DaemonStatusPayload> =>
    ipcRenderer.invoke(IPC_CHANNELS.DAEMON_STATUS),
  getDaemonPort: (): Promise<number> => ipcRenderer.invoke(IPC_CHANNELS.DAEMON_PORT),

  // ── 偏好设置 ──
  updatePreferences: (key: string, value: unknown) =>
    ipcRenderer.send(IPC_CHANNELS.PREFERENCES_UPDATE, { key, value } satisfies PreferencesUpdatePayload)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
