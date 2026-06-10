import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { IPC_CHANNELS, PetSwitchPayload } from '../../shared/ipc-channels'

let chatWindow: BrowserWindow | null = null

export function getChatWindow(): BrowserWindow | null {
  return chatWindow && !chatWindow.isDestroyed() ? chatWindow : null
}

export function openChatWindow(petId: string): BrowserWindow {
  const existing = getChatWindow()

  if (existing) {
    existing.show()
    existing.focus()
    existing.webContents.send(IPC_CHANNELS.PET_SWITCH, { petId } satisfies PetSwitchPayload)
    return existing
  }

  chatWindow = new BrowserWindow({
    width: 560,
    height: 780,
    minWidth: 460,
    minHeight: 640,
    frame: false,
    titleBarStyle: 'hidden',
    vibrancy: 'under-window',
    backgroundMaterial: 'acrylic',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  chatWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  chatWindow.once('ready-to-show', () => {
    chatWindow?.show()
    chatWindow?.webContents.send(IPC_CHANNELS.PET_SWITCH, { petId } satisfies PetSwitchPayload)
  })

  chatWindow.on('closed', () => {
    chatWindow = null
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    chatWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/chat-window/index.html`)
  } else {
    chatWindow.loadFile(join(__dirname, '../renderer/chat-window/index.html'))
  }

  return chatWindow
}

export function closeChatWindow(): void {
  getChatWindow()?.hide()
}
