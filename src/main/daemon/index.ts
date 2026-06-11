import { spawn, ChildProcess } from 'node:child_process'
import { BrowserWindow } from 'electron'
import { IPC_CHANNELS, DaemonStatus, DaemonStatusPayload } from '../../shared/ipc-channels'

const DAEMON_START_PORT = 8000
const DAEMON_MAX_PORT = 8100
const HEALTH_CHECK_INTERVAL = 30_000
const MAX_RESTART_ATTEMPTS = 5
const RESTART_BASE_DELAY = 2000

let daemonProcess: ChildProcess | null = null
let daemonPort = DAEMON_START_PORT
let daemonStatus: DaemonStatus = 'stopped'
let restartAttempts = 0
let healthCheckTimer: NodeJS.Timeout | null = null
let getAllWindows: (() => BrowserWindow[]) | null = null

function broadcastStatus(payload: DaemonStatusPayload): void {
  if (!getAllWindows) return
  for (const win of getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.DAEMON_STATUS, payload)
    }
  }
}

function setStatus(status: DaemonStatus, port?: number): void {
  daemonStatus = status
  broadcastStatus({ status, port: port ?? (status === 'running' ? daemonPort : undefined) })
}

/** Scan for an available port starting from DAEMON_START_PORT */
async function findAvailablePort(): Promise<number> {
  const { createServer } = await import('node:net')
  for (let port = DAEMON_START_PORT; port <= DAEMON_MAX_PORT; port++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = createServer()
        server.once('error', reject)
        server.once('listening', () => {
          server.close(() => resolve())
        })
        server.listen(port, '127.0.0.1')
      })
      return port
    } catch {
      continue
    }
  }
  return DAEMON_START_PORT
}

/** Check if the daemon is healthy */
export async function checkDaemonHealth(): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${daemonPort}/health`, {
      signal: AbortSignal.timeout(5000)
    })
    return res.ok
  } catch {
    return false
  }
}

/** Detect if a local Ollama instance is running with usable models */
export async function detectLocalModel(): Promise<{ available: boolean; models: string[] }> {
  try {
    const res = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(3000)
    })
    if (!res.ok) return { available: false, models: [] }
    const data = (await res.json()) as { models?: { name: string }[] }
    const models = data.models?.map((m) => m.name) ?? []
    return { available: models.length > 0, models }
  } catch {
    return { available: false, models: [] }
  }
}

/** Start the daemon process */
export async function startDaemon(
  getWindows: () => BrowserWindow[],
  daemonCommand?: string
): Promise<void> {
  getAllWindows = getWindows

  if (daemonProcess && daemonStatus === 'running') {
    return
  }

  setStatus('starting')

  try {
    daemonPort = await findAvailablePort()
  } catch {
    daemonPort = DAEMON_START_PORT
  }

  const command = daemonCommand ?? 'uvicorn'
  const args = ['app.main:app', '--host', '127.0.0.1', '--port', String(daemonPort)]

  try {
    daemonProcess = spawn(command, args, {
      env: {
        ...process.env,
        NO_PROXY: 'localhost,127.0.0.1',
        PET_MODEL: process.env.PET_MODEL ?? 'gemma2:2b-instruct-q4_K_M',
        MIAO_DAEMON_PORT: String(daemonPort)
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    daemonProcess.on('error', (err) => {
      console.error('[Daemon] Spawn error:', err.message)
      setStatus('error')
      scheduleRestart(getWindows, daemonCommand)
    })

    daemonProcess.on('exit', (code) => {
      if (daemonStatus !== 'stopped') {
        console.error(`[Daemon] Exited with code ${code}`)
        setStatus('error')
        scheduleRestart(getWindows, daemonCommand)
      }
    })

    daemonProcess.stdout?.on('data', (data: Buffer) => {
      console.log(`[Daemon:out] ${data.toString().trim()}`)
    })

    daemonProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`[Daemon:err] ${data.toString().trim()}`)
    })

    // Wait for daemon to become healthy
    const healthy = await waitForHealth(30_000)
    if (healthy) {
      setStatus('running', daemonPort)
      restartAttempts = 0
      startHealthCheck(getWindows, daemonCommand)
    } else {
      setStatus('error')
      scheduleRestart(getWindows, daemonCommand)
    }
  } catch (err) {
    console.error('[Daemon] Failed to start:', err)
    setStatus('error')
  }
}

/** Stop the daemon process */
export function stopDaemon(): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer)
    healthCheckTimer = null
  }
  if (daemonProcess && !daemonProcess.killed) {
    daemonProcess.kill('SIGTERM')
    daemonProcess = null
  }
  setStatus('stopped')
}

/** Get current daemon status and port */
export function getDaemonInfo(): { status: DaemonStatus; port: number } {
  return { status: daemonStatus, port: daemonPort }
}

function scheduleRestart(getWindows: () => BrowserWindow[], daemonCommand?: string): void {
  if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
    console.error('[Daemon] Max restart attempts reached, giving up')
    setStatus('error')
    return
  }

  restartAttempts++
  const delay = RESTART_BASE_DELAY * Math.pow(2, restartAttempts - 1)
  console.log(
    `[Daemon] Restarting in ${delay}ms (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})`
  )

  setTimeout(() => {
    stopDaemon()
    startDaemon(getWindows, daemonCommand)
  }, delay)
}

function startHealthCheck(getWindows: () => BrowserWindow[], daemonCommand?: string): void {
  if (healthCheckTimer) clearInterval(healthCheckTimer)
  healthCheckTimer = setInterval(async () => {
    const healthy = await checkDaemonHealth()
    if (!healthy && daemonStatus === 'running') {
      console.warn('[Daemon] Health check failed, restarting...')
      setStatus('error')
      scheduleRestart(getWindows, daemonCommand)
    }
  }, HEALTH_CHECK_INTERVAL)
}

async function waitForHealth(timeoutMs: number): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await checkDaemonHealth()) return true
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}
