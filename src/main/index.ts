import { app, BrowserWindow } from 'electron'
import { createPetWindow } from './windows/petWindow'
import { openChatWindow } from './windows/chatWindow'
import { createAppTray, destroyAppTray } from './tray'
import { registerWindowIpc } from './ipc/window'
import { registerDaemonIpc } from './ipc/daemon'
import { startDaemon, stopDaemon, getDaemonInfo } from './daemon/index'
import { initDesktopWs, disconnectDesktopWs } from './daemon/desktop-ws'

let petWindow: BrowserWindow | null = null

function getAllWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
}

function createWindows(): void {
  petWindow = createPetWindow()
  registerWindowIpc(() => petWindow)
  registerDaemonIpc(getAllWindows)
  createAppTray(() => petWindow)
  openChatWindow('list')
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.tensorbee.6mao')
  createWindows()

  // Start Daemon if MIAO_DAEMON_COMMAND is set (e.g. "uvicorn")
  const daemonCommand = process.env.MIAO_DAEMON_COMMAND
  if (daemonCommand) {
    await startDaemon(getAllWindows, daemonCommand)
  }

  // Initialize WebSocket bridge once daemon is running
  const info = getDaemonInfo()
  if (info.status === 'running') {
    initDesktopWs(info.port, 'demo-cat', getAllWindows)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindows()
    } else {
      petWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  // Keep the tray app alive until the user chooses "退出".
  // Daemon continues running even when windows are closed.
})

app.on('before-quit', () => {
  disconnectDesktopWs()
  stopDaemon()
  destroyAppTray()
})
