import { BrowserWindow } from 'electron'
import {
  IPC_CHANNELS,
  PetAction,
  PetActionPayload,
  PetEmotionPayload,
  PetProactivePayload
} from '../../shared/ipc-channels'

export interface DesktopWsMessage {
  type: 'action' | 'master_start' | 'master_done' | 'master_artifact' | 'remind' | 'status_update'
  name?: string
  text?: string
  masterType?: string
  taskId?: string
  artifact?: { type: string; data: string }
  stats?: Record<string, number>
}

let ws: WebSocket | null = null
let reconnectTimer: NodeJS.Timeout | null = null
let getWindows: (() => BrowserWindow[]) | null = null
let daemonPort = 8000
let petId = ''

const RECONNECT_INTERVAL = 5000
const PET_ACTIONS = new Set<PetAction>([
  'stand',
  'walk',
  'run',
  'turn',
  'sit',
  'lie',
  'sleep',
  'stretch',
  'groom',
  'jump',
  'meow',
  'shadow'
])

/** Initialize the desktop WebSocket bridge */
export function initDesktopWs(
  port: number,
  currentPetId: string,
  windowProvider: () => BrowserWindow[]
): void {
  daemonPort = port
  petId = currentPetId
  getWindows = windowProvider
  connect()
}

/** Update pet ID for WebSocket subscription */
export function updateWsPetId(newPetId: string): void {
  petId = newPetId
  if (ws && ws.readyState === WebSocket.OPEN) {
    // Reconnect with new pet ID
    disconnect()
    connect()
  }
}

/** Update daemon port (e.g. after restart on different port) */
export function updateWsPort(port: number): void {
  if (port === daemonPort && ws?.readyState === WebSocket.OPEN) return
  daemonPort = port
  disconnect()
  connect()
}

/** Disconnect the WebSocket */
export function disconnectDesktopWs(): void {
  disconnect()
}

/** Get current connection state */
export function getWsState(): number | null {
  return ws?.readyState ?? null
}

function connect(): void {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return
  }

  const url = `ws://localhost:${daemonPort}/ws/desktop?pet_id=${encodeURIComponent(petId)}`

  try {
    ws = new WebSocket(url)
  } catch (err) {
    console.error('[DesktopWs] Failed to create WebSocket:', err)
    scheduleReconnect()
    return
  }

  ws.onopen = () => {
    console.log('[DesktopWs] Connected to', url)
    clearReconnect()
  }

  ws.onmessage = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(String(event.data)) as DesktopWsMessage
      handleMessage(msg)
    } catch (err) {
      console.warn('[DesktopWs] Failed to parse message:', err)
    }
  }

  ws.onclose = () => {
    console.log('[DesktopWs] Disconnected')
    ws = null
    scheduleReconnect()
  }

  ws.onerror = (err) => {
    console.error('[DesktopWs] Error:', err)
  }
}

function disconnect(): void {
  clearReconnect()
  if (ws) {
    ws.onclose = null
    ws.onerror = null
    ws.onmessage = null
    ws.close()
    ws = null
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, RECONNECT_INTERVAL)
}

function clearReconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function handleMessage(msg: DesktopWsMessage): void {
  if (!getWindows) return

  switch (msg.type) {
    case 'action': {
      // Daemon pushes a pet action (e.g. "paw_wave", "idle_nap")
      const name = msg.name ?? 'idle'
      const emotion = name as PetEmotionPayload['emotion']
      const action = name as PetAction
      for (const win of getWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send(IPC_CHANNELS.PET_EMOTION, { emotion } satisfies PetEmotionPayload)
          if (PET_ACTIONS.has(action)) {
            win.webContents.send(IPC_CHANNELS.PET_ACTION, { action } satisfies PetActionPayload)
          }
        }
      }
      break
    }

    case 'master_start': {
      // A master agent has started working
      for (const win of getWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send(IPC_CHANNELS.MASTER_START, {
            masterType: msg.masterType ?? 'unknown',
            taskId: msg.taskId ?? ''
          })
          // Pet shows thinking animation
          win.webContents.send(IPC_CHANNELS.PET_EMOTION, { emotion: 'thinking' })
        }
      }
      break
    }

    case 'master_done': {
      // A master agent has finished
      for (const win of getWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send(IPC_CHANNELS.MASTER_DONE, {
            taskId: msg.taskId ?? '',
            summary: msg.text
          })
          // Pet celebrates
          win.webContents.send(IPC_CHANNELS.PET_EMOTION, { emotion: 'celebrate' })
        }
      }
      break
    }

    case 'master_artifact': {
      // A master produced an artifact (image, code, etc.)
      if (msg.artifact) {
        for (const win of getWindows()) {
          if (!win.isDestroyed()) {
            win.webContents.send(IPC_CHANNELS.MASTER_ARTIFACT, {
              taskId: msg.taskId ?? '',
              type: msg.artifact.type as 'image' | 'code' | 'text' | 'search',
              data: msg.artifact.data
            })
          }
        }
      }
      break
    }

    case 'remind': {
      // Proactive reminder from scheduler
      const proactive: PetProactivePayload = {
        action: 'remind',
        text: msg.text
      }
      for (const win of getWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send(IPC_CHANNELS.PET_PROACTIVE, proactive)
          win.webContents.send(IPC_CHANNELS.PET_EMOTION, { emotion: 'paw_wave' })
        }
      }
      break
    }

    case 'status_update': {
      // Pet stats changed, forward to chat window
      for (const win of getWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send(IPC_CHANNELS.PET_STATUS_UPDATE, msg.stats)
        }
      }
      break
    }
  }
}
