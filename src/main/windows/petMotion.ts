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
const CORNER_LOCK_INTERVAL = 25000
const CORNER_LOCK_DURATION = 20000
const DRAG_CORNER_REST_MS = 18000
const DRAG_EDGE_SNAP_DISTANCE = 96
const PASSIVE_ACTIONS: PetAction[] = ['stand', 'sit', 'stretch', 'groom', 'lie', 'sleep', 'meow']
const controllers = new Map<number, PetMotionController>()

export function getPetMotionController(petWindow: BrowserWindow): PetMotionController | undefined {
  return controllers.get(petWindow.id)
}

export function startPetMotion(petWindow: BrowserWindow): PetMotionController {
  // Freeze the intended window size at creation to avoid DPI-rounding drift.
  // On Windows with non-integer DPI scaling, getPosition / setPosition can cause
  // getBounds().width/height to grow by ~1 px per call, shrinking the movement area.
  const winWidth = petWindow.getBounds().width
  const winHeight = petWindow.getBounds().height

  let mode: MotionMode = 'rest'
  let target: Point | null = null
  let action: PetAction = 'stand'
  let direction: PetDirection = 'right'
  let nextDecisionAt = Date.now() + 2500
  let nextCornerLockAt = Date.now() + CORNER_LOCK_INTERVAL
  let shouldLockOnArrival = false
  let unlockAt = 0
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

  /** Move window without letting DPI rounding drift the size. */
  const moveWindow = (x: number, y: number): void => {
    if (petWindow.isDestroyed()) return
    petWindow.setBounds({ x, y, width: winWidth, height: winHeight }, false)
  }

  const getWindowPos = (): Point => {
    const b = petWindow.getBounds()
    return { x: b.x, y: b.y }
  }

  const getWindowCenter = (): Point => {
    const pos = getWindowPos()
    return {
      x: pos.x + winWidth / 2,
      y: pos.y + winHeight / 2
    }
  }

  const getPetDisplay = () => {
    const pos = getWindowPos()
    const matchingDisplay = screen.getDisplayMatching({
      ...pos,
      width: winWidth,
      height: winHeight
    })
    if (matchingDisplay) return matchingDisplay

    return screen.getDisplayNearestPoint(getWindowCenter())
  }

  const getMovementArea = (padding = EDGE_PADDING, fullDisplay = false): MovementArea => {
    const display = getPetDisplay()
    const area = fullDisplay ? display.bounds : display.workArea
    const maxX = Math.max(area.x + padding, area.x + area.width - winWidth - padding)
    const maxY = Math.max(area.y + padding, area.y + area.height - winHeight - padding)

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
    const area = dragDisplayBounds ?? screen.getDisplayNearestPoint(cursor).workArea
    const minX = area.x
    const minY = area.y
    const maxX = area.x + area.width - winWidth
    const maxY = area.y + area.height - winHeight

    let nextX = cursor.x - dragOffset.x
    let nextY = cursor.y - dragOffset.y

    if (cursor.x <= area.x + DRAG_EDGE_SNAP_DISTANCE) {
      nextX = minX
    } else if (cursor.x >= area.x + area.width - DRAG_EDGE_SNAP_DISTANCE) {
      nextX = maxX
    }

    if (cursor.y <= area.y + DRAG_EDGE_SNAP_DISTANCE) {
      nextY = minY
    } else if (cursor.y >= area.y + area.height - DRAG_EDGE_SNAP_DISTANCE) {
      nextY = maxY
    }

    return {
      x: Math.min(maxX, Math.max(minX, Math.round(nextX))),
      y: Math.min(maxY, Math.max(minY, Math.round(nextY)))
    }
  }

  const updateDragPosition = (): void => {
    const nextPoint = getDragPoint()
    if (!nextPoint) return
    moveWindow(nextPoint.x, nextPoint.y)
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
    const pos = getWindowPos()
    const restDuration = isNearCorner(pos)
      ? 9000 + Math.random() * 9000
      : 2500 + Math.random() * 6500
    nextDecisionAt = Date.now() + restDuration
  }

  const chooseMove = (nextTarget = preferredPoint(), lockOnArrival = false): void => {
    mode = 'move'
    target = nextTarget
    shouldLockOnArrival = lockOnArrival
    const pos = getWindowPos()
    const nextDirection: PetDirection = target.x < pos.x ? 'left' : 'right'
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
    if (mode === 'drag') return
    if (mode === 'locked') {
      if (now >= unlockAt) {
        mode = 'rest'
        target = null
        shouldLockOnArrival = false
        sendAction('stand')
        nextDecisionAt = Date.now() + 2000
      }
      return
    }

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

    const pos = getWindowPos()
    const clampedPos = clampPoint(pos, 0)
    if (clampedPos.x !== pos.x || clampedPos.y !== pos.y) {
      moveWindow(clampedPos.x, clampedPos.y)
    }
    const dx = target.x - clampedPos.x
    const dy = target.y - clampedPos.y
    const distance = Math.hypot(dx, dy)

    if (distance <= 3) {
      const nextPoint = clampPoint(target, 0)
      moveWindow(nextPoint.x, nextPoint.y)
      if (shouldLockOnArrival) {
        mode = 'locked'
        target = null
        shouldLockOnArrival = false
        unlockAt = Date.now() + CORNER_LOCK_DURATION + Math.random() * 10000
        sendAction(Math.random() > 0.45 ? 'sit' : 'sleep')
        return
      }
      chooseRest()
      return
    }

    const speed = action === 'run' ? 4.8 : 2.4
    const step = Math.min(speed, distance)
    const nextPoint = clampPoint(
      {
        x: clampedPos.x + (dx / distance) * step,
        y: clampedPos.y + (dy / distance) * step
      },
      0
    )
    const nextDirection: PetDirection = dx < 0 ? 'left' : 'right'

    sendAction(action === 'run' ? 'run' : 'walk', nextDirection)
    moveWindow(nextPoint.x, nextPoint.y)
  }

  petWindow.webContents.once('did-finish-load', () => {
    sendAction('stand')
  })

  const controller: PetMotionController = {
    startDrag: () => {
      const pos = getWindowPos()
      const cursor = screen.getCursorScreenPoint()
      dragDisplayBounds = getPetDisplay().workArea
      mode = 'drag'
      target = null
      shouldLockOnArrival = false
      dragOffset = {
        x: cursor.x - pos.x,
        y: cursor.y - pos.y
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
      const pos = getWindowPos()
      if (isNearCorner(pos, 0)) {
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
