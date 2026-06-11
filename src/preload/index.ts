import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC_CHANNELS,
  OpenChatPayload,
  PetAction,
  PetActionPayload,
  PetCurrentPayload,
  PetDragPayload,
  PetEmotion,
  PetEmotionPayload,
  PetProactivePayload,
  PetSwitchPayload
} from '../shared/ipc-channels'

const electronAPI = {
  openChat: (petId: string) =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_OPEN_CHAT, { petId } satisfies OpenChatPayload),
  closeChat: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE_CHAT),
  setIgnoreMouse: (ignore: boolean) =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_SET_IGNORE_MOUSE, ignore),
  startPetDrag: (payload: PetDragPayload) =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_PET_DRAG_START, payload),
  movePetDrag: (payload: PetDragPayload) =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_PET_DRAG_MOVE, payload),
  endPetDrag: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_PET_DRAG_END),
  resumePetMotion: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_PET_MOTION_RESUME),
  notifyPetEmotion: (emotion: PetEmotion) =>
    ipcRenderer.send(IPC_CHANNELS.PET_EMOTION, { emotion } satisfies PetEmotionPayload),
  notifyPetAction: (action: PetAction) =>
    ipcRenderer.send(IPC_CHANNELS.PET_ACTION, { action } satisfies PetActionPayload),
  setCurrentPet: (pet: { petId: string; name: string }) =>
    ipcRenderer.send(IPC_CHANNELS.PET_CURRENT, pet satisfies PetCurrentPayload),
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
  onPetAction: (callback: (payload: PetActionPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PetActionPayload) => {
      callback(payload)
    }
    ipcRenderer.on(IPC_CHANNELS.PET_ACTION, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PET_ACTION, listener)
  },
  onPetProactive: (callback: (payload: PetProactivePayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PetProactivePayload) => {
      callback(payload)
    }
    ipcRenderer.on(IPC_CHANNELS.PET_PROACTIVE, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PET_PROACTIVE, listener)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
