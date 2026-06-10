import { app, BrowserWindow } from 'electron'
import { createPetWindow } from './windows/petWindow'
import { createAppTray, destroyAppTray } from './tray'
import { registerWindowIpc } from './ipc/window'

let petWindow: BrowserWindow | null = null

function createWindows(): void {
  petWindow = createPetWindow()
  registerWindowIpc(() => petWindow)
  createAppTray(() => petWindow)
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.tensorbee.6mao')
  createWindows()

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
})

app.on('before-quit', () => {
  destroyAppTray()
})
