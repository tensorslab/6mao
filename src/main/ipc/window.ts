import { BrowserWindow, ipcMain } from 'electron'
import {
  IPC_CHANNELS,
  OpenChatPayload,
  PetActionPayload,
  PetCurrentPayload,
  PetEmotionPayload
} from '../../shared/ipc-channels'
import { closeChatWindow, getChatWindow, openChatWindow } from '../windows/chatWindow'
import { getPetMotionController } from '../windows/petMotion'

let registered = false
let ignoreMouseTimer: NodeJS.Timeout | null = null
let petDragActive = false

export function registerWindowIpc(getPetWindow: () => BrowserWindow | null): void {
  if (registered) return
  registered = true

  ipcMain.on(IPC_CHANNELS.WINDOW_OPEN_CHAT, (_event, payload: OpenChatPayload) => {
    openChatWindow(payload.petId)
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE_CHAT, () => {
    closeChatWindow()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_SET_IGNORE_MOUSE, (_event, ignore: boolean) => {
    const petWindow = getPetWindow()
    if (!petWindow || petWindow.isDestroyed()) return
    if (petDragActive && ignore) return

    if (ignoreMouseTimer) clearTimeout(ignoreMouseTimer)
    ignoreMouseTimer = setTimeout(() => {
      if (petDragActive && ignore) return
      petWindow.setIgnoreMouseEvents(ignore, { forward: true })
    }, 16)
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_PET_DRAG_START, () => {
    const petWindow = getPetWindow()
    if (!petWindow || petWindow.isDestroyed()) return
    petDragActive = true
    if (ignoreMouseTimer) {
      clearTimeout(ignoreMouseTimer)
      ignoreMouseTimer = null
    }
    petWindow.setIgnoreMouseEvents(false)
    getPetMotionController(petWindow)?.startDrag()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_PET_DRAG_MOVE, () => {
    const petWindow = getPetWindow()
    if (!petWindow || petWindow.isDestroyed()) return
    getPetMotionController(petWindow)?.dragTo()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_PET_DRAG_END, () => {
    petDragActive = false
    const petWindow = getPetWindow()
    if (!petWindow || petWindow.isDestroyed()) return
    getPetMotionController(petWindow)?.endDrag()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_PET_MOTION_RESUME, () => {
    petDragActive = false
    const petWindow = getPetWindow()
    if (!petWindow || petWindow.isDestroyed()) return
    getPetMotionController(petWindow)?.resume()
  })

  ipcMain.on(IPC_CHANNELS.PET_EMOTION, (_event, payload: PetEmotionPayload) => {
    const petWindow = getPetWindow()
    if (!petWindow || petWindow.isDestroyed()) return
    petWindow.webContents.send(IPC_CHANNELS.PET_EMOTION, payload)
  })

  ipcMain.on(IPC_CHANNELS.PET_ACTION, (_event, payload: PetActionPayload) => {
    const petWindow = getPetWindow()
    if (!petWindow || petWindow.isDestroyed()) return
    petWindow.webContents.send(IPC_CHANNELS.PET_ACTION, payload)
  })

  ipcMain.on(IPC_CHANNELS.PET_CURRENT, (_event, payload: PetCurrentPayload) => {
    const petWindow = getPetWindow()
    if (!petWindow || petWindow.isDestroyed()) return
    petWindow.webContents.send(IPC_CHANNELS.PET_CURRENT, payload)
  })

  ipcMain.on(IPC_CHANNELS.PET_STATUS_UPDATE, (_event, payload) => {
    getChatWindow()?.webContents.send(IPC_CHANNELS.PET_STATUS_UPDATE, payload)
  })
}
