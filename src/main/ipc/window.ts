import { BrowserWindow, ipcMain } from 'electron'
import { IPC_CHANNELS, OpenChatPayload, PetEmotionPayload } from '../../shared/ipc-channels'
import { closeChatWindow, getChatWindow, openChatWindow } from '../windows/chatWindow'

let registered = false
let ignoreMouseTimer: NodeJS.Timeout | null = null

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

    if (ignoreMouseTimer) clearTimeout(ignoreMouseTimer)
    ignoreMouseTimer = setTimeout(() => {
      petWindow.setIgnoreMouseEvents(ignore, { forward: true })
    }, 16)
  })

  ipcMain.on(IPC_CHANNELS.PET_EMOTION, (_event, payload: PetEmotionPayload) => {
    const petWindow = getPetWindow()
    if (!petWindow || petWindow.isDestroyed()) return
    petWindow.webContents.send(IPC_CHANNELS.PET_EMOTION, payload)
  })

  ipcMain.on(IPC_CHANNELS.PET_STATUS_UPDATE, (_event, payload) => {
    getChatWindow()?.webContents.send(IPC_CHANNELS.PET_STATUS_UPDATE, payload)
  })
}
