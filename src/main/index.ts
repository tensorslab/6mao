import { app, BrowserWindow } from 'electron'
import { createPetWindow } from './windows/petWindow'
import { openChatWindow } from './windows/chatWindow'
import { createAppTray, destroyAppTray } from './tray'
import { registerWindowIpc } from './ipc/window'
import { registerDaemonIpc } from './ipc/daemon'
import { startDaemon, stopDaemon, getDaemonInfo, onDaemonStatusChange } from './daemon/index'
import { initDesktopWs, disconnectDesktopWs, updateWsPort, updateWsPetId } from './daemon/desktop-ws'

let petWindow: BrowserWindow | null = null
let currentPetId = 'demo-cat'
let wsInitialized = false

function getAllWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
}

/** Called by window IPC when the active pet changes */
function onPetIdChange(petId: string): void {
  currentPetId = petId
  updateWsPetId(petId)
}

function createWindows(): void {
  petWindow = createPetWindow()
  registerWindowIpc(() => petWindow, onPetIdChange)
  registerDaemonIpc(getAllWindows)
  createAppTray(() => petWindow)
  openChatWindow('list')
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.tensorbee.6mao')
  createWindows()

  // Subscribe to daemon status changes — re-init or update WebSocket whenever daemon (re)starts
  onDaemonStatusChange((status, port) => {
    if (status === 'running' && port) {
      if (!wsInitialized) {
        initDesktopWs(port, currentPetId, getAllWindows)
        wsInitialized = true
      } else {
        updateWsPort(port)
      }
    }
  })

  // Start Daemon if MIAO_DAEMON_COMMAND is set (e.g. "uvicorn")
  const daemonCommand = process.env.MIAO_DAEMON_COMMAND
  if (daemonCommand) {
    await startDaemon(getAllWindows, daemonCommand)
  }

  // Fallback: if daemon was already running before subscription (e.g. started externally)
  if (!wsInitialized) {
    const info = getDaemonInfo()
    if (info.status === 'running') {
      initDesktopWs(info.port, currentPetId, getAllWindows)
      wsInitialized = true
    }
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
