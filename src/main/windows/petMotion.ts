import { BrowserWindow, screen, type Rectangle } from 'electron'
import { IPC_CHANNELS, PetAction, PetActionPayload, PetDirection } from '../../shared/ipc-channels'

interface Point {
  x: number
  y: number
}

interface MovementArea {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface PetMotionController {
  startDrag: () => void
  dragTo: () => void
  endDrag: () => void
  resume: () => void
  stop: () => void
}

type MotionMode = 'rest' | 'move' | 'drag' | 'locked'

const TICK_MS = 33
const EDGE_PADDING = 24
const CORNER_WANDER_RADIUS = 96
const CORNER_LOCK_INTERVAL = 45000
const DRAG_CORNER_REST_MS = 18000
const DRAG_EDGE_SNAP_DISTANCE = 96
const PASSIVE_ACTIONS: PetAction[] = ['stand', 'sit', 'stretch', 'groom', 'lie', 'sleep', 'meow']
const controllers = new Map<number, PetMotionController>()

export function getPetMotionController(petWindow: BrowserWindow): PetMotionController | undefined {
  return controllers.get(petWindow.id)
}

export function startPetMotion(petWindow: BrowserWindow): PetMotionController {
  let mode: MotionMode = 'rest'
  let target: Point | null = null
  let action: PetAction = 'stand'
  let direction: PetDirection = 'right'
  let nextDecisionAt = Date.now() + 2500
  let nextCornerLockAt = Date.now() + CORNER_LOCK_INTERVAL
  let shouldLockOnArrival = false
  let dragOffset: Point | null = null
  let dragDisplayBounds: Rectangle | null = null
  let timer: NodeJS.Timeout | null = null
  let dragTimer: NodeJS.Timeout | null = null

  const sendAction = (nextAction: PetAction, nextDirection = direction): void => {
    if (action === nextAction && direction === nextDirection) return

    action = nextAction
    direction = nextDirection
    if (!petWindow.isDestroyed()) {
      petWindow.webContents.send(IPC_CHANNELS.PET_ACTION, {
        action,
        direction
      } satisfies PetActionPayload)
    }
  }

  const getWindowCenter = (): Point => {
    const bounds = petWindow.getBounds()
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    }
  }

  const getPetDisplay = () => {
    const bounds = petWindow.getBounds()
    const matchingDisplay = screen.getDisplayMatching(bounds)
    if (matchingDisplay) return matchingDisplay

    return screen.getDisplayNearestPoint(getWindowCenter())
  }

  const getMovementArea = (padding = EDGE_PADDING, fullDisplay = false): MovementArea => {
    const bounds = petWindow.getBounds()
    const display = getPetDisplay()
    const area = fullDisplay ? display.bounds : display.workArea
    const maxX = Math.max(area.x + padding, area.x + area.width - bounds.width - padding)
    const maxY = Math.max(area.y + padding, area.y + area.height - bounds.height - padding)

    return {
      minX: area.x + padding,
      minY: area.y + padding,
      maxX,
      maxY
    }
  }

  const clampPointToArea = (point: Point, area: MovementArea): Point => {
    return {
      x: Math.min(area.maxX, Math.max(area.minX, Math.round(point.x))),
      y: Math.min(area.maxY, Math.max(area.minY, Math.round(point.y)))
    }
  }

  const clampPoint = (point: Point, padding = EDGE_PADDING, fullDisplay = false): Point => {
    return clampPointToArea(point, getMovementArea(padding, fullDisplay))
  }

  const getDragPoint = (): Point | null => {
    if (!dragOffset) return null

    const cursor = screen.getCursorScreenPoint()
    const bounds = petWindow.getBounds()
    const displayBounds = dragDisplayBounds ?? screen.getDisplayNearestPoint(cursor).bounds
    const minX = displayBounds.x
    const minY = displayBounds.y
    const maxX = displayBounds.x + displayBounds.width - bounds.width
    const maxY = displayBounds.y + displayBounds.height - bounds.height

    let nextX = cursor.x - dragOffset.x
    let nextY = cursor.y - dragOffset.y

    if (cursor.x <= displayBounds.x + DRAG_EDGE_SNAP_DISTANCE) {
      nextX = minX
    } else if (cursor.x >= displayBounds.x + displayBounds.width - DRAG_EDGE_SNAP_DISTANCE) {
      nextX = maxX
    }

    if (cursor.y <= displayBounds.y + DRAG_EDGE_SNAP_DISTANCE) {
      nextY = minY
    } else if (cursor.y >= displayBounds.y + displayBounds.height - DRAG_EDGE_SNAP_DISTANCE) {
      nextY = maxY
    }

    return {
      x: Math.min(maxX, Math.max(minX, Math.round(nextX))),
      y: Math.min(maxY, Math.max(minY, Math.round(nextY)))
    }
  }

  const updateDragPosition = (): void => {
    if (petWindow.isDestroyed()) return

    const nextPoint = getDragPoint()
    if (!nextPoint) return
    petWindow.setPosition(nextPoint.x, nextPoint.y, false)
  }

  const randomPoint = (): Point => {
    const area = getMovementArea()

    return {
      x: Math.round(area.minX + Math.random() * (area.maxX - area.minX)),
      y: Math.round(area.minY + Math.random() * (area.maxY - area.minY))
    }
  }

  const cornerPoint = (): Point => {
    const area = getMovementArea()
    const corners: Point[] = [
      { x: area.minX, y: area.minY },
      { x: area.maxX, y: area.minY },
      { x: area.minX, y: area.maxY },
      { x: area.maxX, y: area.maxY }
    ]
    const corner = corners[Math.floor(Math.random() * corners.length)]

    return clampPoint({
      x: corner.x + (Math.random() - 0.5) * CORNER_WANDER_RADIUS,
      y: corner.y + (Math.random() - 0.5) * CORNER_WANDER_RADIUS
    })
  }

  const exactCornerPoint = (): Point => {
    const area = getMovementArea(0)
    const corners: Point[] = [
      { x: area.minX, y: area.minY },
      { x: area.maxX, y: area.minY },
      { x: area.minX, y: area.maxY },
      { x: area.maxX, y: area.maxY }
    ]
    return corners[Math.floor(Math.random() * corners.length)]
  }

  const isNearCorner = (point: Point, padding = EDGE_PADDING, fullDisplay = false): boolean => {
    const area = getMovementArea(padding, fullDisplay)
    const corners: Point[] = [
      { x: area.minX, y: area.minY },
      { x: area.maxX, y: area.minY },
      { x: area.minX, y: area.maxY },
      { x: area.maxX, y: area.maxY }
    ]

    return corners.some((corner) => Math.hypot(point.x - corner.x, point.y - corner.y) < 120)
  }

  const edgePoint = (): Point => {
    const area = getMovementArea()
    const side = Math.floor(Math.random() * 4)

    if (side === 0)
      return { x: Math.round(area.minX + Math.random() * (area.maxX - area.minX)), y: area.minY }
    if (side === 1)
      return { x: area.maxX, y: Math.round(area.minY + Math.random() * (area.maxY - area.minY)) }
    if (side === 2)
      return { x: Math.round(area.minX + Math.random() * (area.maxX - area.minX)), y: area.maxY }
    return { x: area.minX, y: Math.round(area.minY + Math.random() * (area.maxY - area.minY)) }
  }

  const preferredPoint = (): Point => {
    const roll = Math.random()
    if (roll < 0.62) return cornerPoint()
    if (roll < 0.88) return edgePoint()
    return randomPoint()
  }

  const chooseRest = (): void => {
    mode = 'rest'
    target = null
    shouldLockOnArrival = false
    const nextAction = PASSIVE_ACTIONS[Math.floor(Math.random() * PASSIVE_ACTIONS.length)]
    sendAction(nextAction)
    const bounds = petWindow.getBounds()
    const restDuration = isNearCorner(bounds)
      ? 9000 + Math.random() * 9000
      : 2500 + Math.random() * 6500
    nextDecisionAt = Date.now() + restDuration
  }

  const chooseMove = (nextTarget = preferredPoint(), lockOnArrival = false): void => {
    mode = 'move'
    target = nextTarget
    shouldLockOnArrival = lockOnArrival
    const bounds = petWindow.getBounds()
    const nextDirection: PetDirection = target.x < bounds.x ? 'left' : 'right'
    sendAction(Math.random() > 0.72 ? 'run' : 'walk', nextDirection)
  }

  const chooseCornerLock = (): void => {
    chooseMove(exactCornerPoint(), true)
    nextCornerLockAt = Date.now() + CORNER_LOCK_INTERVAL + Math.random() * 20000
  }

  const tick = (): void => {
    if (petWindow.isDestroyed()) {
      if (timer) clearInterval(timer)
      return
    }

    const now = Date.now()
    if (mode === 'drag' || mode === 'locked') return

    if (mode === 'rest') {
      if (now >= nextDecisionAt) {
        if (now >= nextCornerLockAt) chooseCornerLock()
        else if (Math.random() > 0.35) chooseMove()
        else chooseRest()
      }
      return
    }

    if (!target) {
      chooseRest()
      return
    }

    let bounds = petWindow.getBounds()
    const clampedBounds = clampPoint(bounds)
    if (clampedBounds.x !== bounds.x || clampedBounds.y !== bounds.y) {
      petWindow.setPosition(clampedBounds.x, clampedBounds.y, false)
      bounds = { ...bounds, x: clampedBounds.x, y: clampedBounds.y }
    }
    const dx = target.x - bounds.x
    const dy = target.y - bounds.y
    const distance = Math.hypot(dx, dy)

    if (distance <= 3) {
      const nextPoint = clampPoint(target)
      petWindow.setPosition(nextPoint.x, nextPoint.y, false)
      if (shouldLockOnArrival) {
        mode = 'locked'
        target = null
        shouldLockOnArrival = false
        sendAction(Math.random() > 0.45 ? 'sit' : 'sleep')
        return
      }
      chooseRest()
      return
    }

    const speed = action === 'run' ? 4.8 : 2.4
    const step = Math.min(speed, distance)
    const nextPoint = clampPoint({
      x: bounds.x + (dx / distance) * step,
      y: bounds.y + (dy / distance) * step
    })
    const nextDirection: PetDirection = dx < 0 ? 'left' : 'right'

    sendAction(action === 'run' ? 'run' : 'walk', nextDirection)
    petWindow.setPosition(nextPoint.x, nextPoint.y, false)
  }

  petWindow.webContents.once('did-finish-load', () => {
    sendAction('stand')
  })

  const controller: PetMotionController = {
    startDrag: () => {
      const bounds = petWindow.getBounds()
      const cursor = screen.getCursorScreenPoint()
      dragDisplayBounds = getPetDisplay().bounds
      mode = 'drag'
      target = null
      shouldLockOnArrival = false
      dragOffset = {
        x: cursor.x - bounds.x,
        y: cursor.y - bounds.y
      }
      sendAction('stand')
      if (dragTimer) clearInterval(dragTimer)
      dragTimer = setInterval(updateDragPosition, 16)
    },
    dragTo: () => {
      updateDragPosition()
    },
    endDrag: () => {
      if (dragTimer) {
        clearInterval(dragTimer)
        dragTimer = null
      }
      updateDragPosition()
      dragOffset = null
      dragDisplayBounds = null
      mode = 'rest'
      target = null
      shouldLockOnArrival = false
      if (isNearCorner(petWindow.getBounds(), 0, true)) {
        sendAction(Math.random() > 0.5 ? 'sit' : 'sleep')
        nextDecisionAt = Date.now() + DRAG_CORNER_REST_MS
      } else {
        sendAction('stand')
        nextDecisionAt = Date.now() + 2500
      }
    },
    resume: () => {
      if (dragTimer) {
        clearInterval(dragTimer)
        dragTimer = null
      }
      dragOffset = null
      dragDisplayBounds = null
      mode = 'rest'
      target = null
      shouldLockOnArrival = false
      sendAction('stand')
      nextDecisionAt = Date.now() + 1200
      nextCornerLockAt = Date.now() + CORNER_LOCK_INTERVAL
    },
    stop: () => {
      if (timer) clearInterval(timer)
      if (dragTimer) clearInterval(dragTimer)
      dragDisplayBounds = null
      controllers.delete(petWindow.id)
    }
  }

  controllers.set(petWindow.id, controller)
  timer = setInterval(tick, TICK_MS)
  return controller
}
