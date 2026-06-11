import { ipcMain, BrowserWindow } from 'electron'
import {
  IPC_CHANNELS,
  DaemonStatusPayload,
  PreferencesUpdatePayload
} from '../../shared/ipc-channels'
import { getDaemonInfo } from '../daemon/index'

let registered = false

export function registerDaemonIpc(_getWindows: () => BrowserWindow[]): void {
  if (registered) return
  registered = true

  // Renderer queries daemon status
  ipcMain.handle(IPC_CHANNELS.DAEMON_STATUS, (): DaemonStatusPayload => {
    const info = getDaemonInfo()
    return { status: info.status, port: info.port }
  })

  // Renderer queries daemon port
  ipcMain.handle(IPC_CHANNELS.DAEMON_PORT, (): number => {
    return getDaemonInfo().port
  })

  // Renderer sends preference updates → forward to Daemon via HTTP
  ipcMain.on(IPC_CHANNELS.PREFERENCES_UPDATE, async (_event, payload: PreferencesUpdatePayload) => {
    const { port } = getDaemonInfo()
    if (!port) return
    try {
      await fetch(`http://localhost:${port}/api/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [payload.key]: payload.value })
      })
    } catch (err) {
      console.error('[DaemonIpc] Failed to update preferences:', err)
    }
  })
}
