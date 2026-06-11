import { app, BrowserWindow, screen } from 'electron'
import { join } from 'node:path'

export function createPetWindow(): BrowserWindow {
  const { workArea } = screen.getPrimaryDisplay()
  // 全屏宽度的底部条带，让猫咪可在整个屏幕底部自由漫游
  const stripHeight = 250
  const width = workArea.width
  const height = stripHeight

  const petWindow = new BrowserWindow({
    width,
    height,
    x: workArea.x,
    y: workArea.y + workArea.height - stripHeight,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
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
  // 整体鼠标穿透；猫咪区域可在渲染层通过 pointer-events: auto 重新接收事件
  petWindow.setIgnoreMouseEvents(true, { forward: true })
  // macOS 需要显式调用以确保不抢焦点
  petWindow.setFocusable(false)

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
