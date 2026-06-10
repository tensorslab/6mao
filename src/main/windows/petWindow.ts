import { app, BrowserWindow, screen } from 'electron'
import { join } from 'node:path'

export function createPetWindow(): BrowserWindow {
  const { workArea } = screen.getPrimaryDisplay()
  const width = 220
  const height = 220

  const petWindow = new BrowserWindow({
    width,
    height,
    x: workArea.x + workArea.width - width - 32,
    y: workArea.y + workArea.height - height - 32,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  petWindow.setAlwaysOnTop(true, 'floating')
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  // Keep first launch clickable; renderer toggles pass-through after pointer movement.
  petWindow.setIgnoreMouseEvents(false)

  petWindow.once('ready-to-show', () => {
    petWindow.showInactive()
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    petWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/pet-window/index.html`)
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/pet-window/index.html'))
  }

  return petWindow
}
