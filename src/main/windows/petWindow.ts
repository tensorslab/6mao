import { app, BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { startPetMotion } from './petMotion'

export function createPetWindow(): BrowserWindow {
  const { workArea } = screen.getPrimaryDisplay()
  const width = 240
  const height = 240

  const petWindow = new BrowserWindow({
    width,
    height,
    x: workArea.x + workArea.width - width - 32,
    y: workArea.y + workArea.height - height - 32,
    transparent: true,
    backgroundColor: '#00000000',
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
  petWindow.setIgnoreMouseEvents(true, { forward: true })

  petWindow.once('ready-to-show', () => {
    petWindow.showInactive()
  })

  const petMotion = startPetMotion(petWindow)
  petWindow.on('closed', petMotion.stop)

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    petWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/pet-window/index.html`)
  } else {
    petWindow.loadFile(join(__dirname, '../renderer/pet-window/index.html'))
  }

  return petWindow
}
