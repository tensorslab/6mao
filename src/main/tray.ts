import { BrowserWindow, Menu, Tray, app, nativeImage } from 'electron'
import { join } from 'node:path'
import { openChatWindow } from './windows/chatWindow'

let tray: Tray | null = null

function getTrayIcon(): Electron.NativeImage {
  const icon = nativeImage.createFromPath(join(__dirname, '../../resources/tray-icon.svg'))
  return icon.isEmpty() ? nativeImage.createEmpty() : icon.resize({ width: 18, height: 18 })
}

export function createAppTray(getPetWindow: () => BrowserWindow | null): Tray {
  if (tray) return tray

  tray = new Tray(getTrayIcon())
  tray.setToolTip('6mao 桌面猫咪')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: '显示/隐藏猫咪',
        click: () => {
          const petWindow = getPetWindow()
          if (!petWindow) return
          petWindow.isVisible() ? petWindow.hide() : petWindow.showInactive()
        }
      },
      {
        label: '宠物列表',
        click: () => openChatWindow('list')
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => app.quit()
      }
    ])
  )

  tray.on('click', () => {
    const petWindow = getPetWindow()
    if (!petWindow) return
    petWindow.isVisible() ? petWindow.hide() : petWindow.showInactive()
  })

  return tray
}

export function destroyAppTray(): void {
  tray?.destroy()
  tray = null
}
