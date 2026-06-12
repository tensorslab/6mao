import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import type { PetAction } from '../../../../shared/ipc-channels'
import { PERSONALITY_CONFIGS } from '../personality'
import type { PetRendererProps } from '../types'

interface CatAnimationProps {
  action: PetAction
  frames: string[]
  fps: number
  loop: boolean
  alt: string
  onComplete?: (action: PetAction) => void
}

function CatAnimation({ action, frames, fps, loop, alt, onComplete }: CatAnimationProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const visibleFrameIndex = Math.min(frameIndex, frames.length - 1)

  useEffect(() => {
    if (frames.length <= 1) return

    const interval = window.setInterval(() => {
      setFrameIndex((current) => {
        if (loop) return (current + 1) % frames.length

        const next = current + 1
        if (next >= frames.length) {
          window.clearInterval(interval)
          onComplete?.(action)
          return frames.length - 1
        }

        return next
      })
    }, 1000 / fps)

    return () => window.clearInterval(interval)
  }, [action, fps, frames.length, loop, onComplete])

  return (
    <img
      className="absolute inset-0 h-full w-full object-contain drop-shadow-xl"
      src={frames[visibleFrameIndex]}
      alt={alt}
      draggable={false}
    />
  )
}

export function CatSprite({ pet, emotion, action, onClick, onActionComplete }: PetRendererProps) {
  const config = PERSONALITY_CONFIGS[pet.personality]
  const dragStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    dragged: boolean
  } | null>(null)
  const suppressClickRef = useRef(false)
  const [loadedFramesByAction, setLoadedFramesByAction] = useState<
    Partial<Record<PetAction, string[]>>
  >({})
  const actionConfig =
    config.spriteAsset?.actions[action] ??
    config.spriteAsset?.actions[config.spriteAsset.defaultAction]
  const initialFrames = useMemo(() => {
    return actionConfig?.frames.length ? actionConfig.frames : [config.spritePath]
  }, [actionConfig, config.spritePath])
  const loadedFrames = loadedFramesByAction[action]
  const frames = loadedFrames?.length ? loadedFrames : initialFrames
  const framesLoaded = Boolean(loadedFrames?.length)

  useEffect(() => {
    let disposed = false
    if (!actionConfig?.loadFrames || framesLoaded) return

    actionConfig?.loadFrames?.().then((loadedFrames) => {
      if (!disposed && loadedFrames.length > 0) {
        setLoadedFramesByAction((current) =>
          current[action]?.length ? current : { ...current, [action]: loadedFrames }
        )
      }
    })

    return () => {
      disposed = true
    }
  }, [action, actionConfig, framesLoaded])

  const startDrag = (event: PointerEvent<HTMLButtonElement>): void => {
    if (event.button !== 0) return

    event.currentTarget.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.screenX,
      startY: event.screenY,
      dragged: false
    }
    window.electronAPI.setIgnoreMouse(false)
    window.electronAPI.startPetDrag({ screenX: event.screenX, screenY: event.screenY })
  }

  const moveDrag = (event: PointerEvent<HTMLButtonElement>): void => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return

    const distance = Math.hypot(event.screenX - dragState.startX, event.screenY - dragState.startY)
    if (distance > 4) {
      dragState.dragged = true
    }

    window.electronAPI.movePetDrag({ screenX: event.screenX, screenY: event.screenY })
  }

  const endDrag = (event: PointerEvent<HTMLButtonElement>): void => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return

    suppressClickRef.current = dragState.dragged
    dragStateRef.current = null
    window.electronAPI.endPetDrag()
    window.electronAPI.setIgnoreMouse(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleClick = (): void => {
    window.electronAPI.resumePetMotion()
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    onClick()
  }

  return (
    <button
      id="cat-sprite"
      className="no-drag group relative grid h-full w-full cursor-grab touch-none select-none place-items-center overflow-hidden border-0 bg-transparent p-0 active:cursor-grabbing"
      onClick={handleClick}
      onPointerCancel={endDrag}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      aria-label={`和 ${pet.name} 聊天`}
    >
      <div
        className={`pointer-events-none absolute inset-0 transition-transform duration-300 group-hover:scale-105 ${
          emotion === 'happy'
            ? 'animate-[bounce_0.8s_ease-in-out_infinite]'
            : emotion === 'sad'
              ? 'grayscale'
              : ''
        }`}
      >
        <div className="h-full w-full">
          <CatAnimation
            key={action}
            action={action}
            frames={frames}
            fps={actionConfig?.fps ?? 10}
            loop={actionConfig?.loop ?? true}
            alt={config.displayName}
            onComplete={onActionComplete}
          />
        </div>
      </div>
      <span
        className="pointer-events-none absolute bottom-3 left-1/2 h-4 w-24 -translate-x-1/2 rounded-full opacity-20 blur-md"
        style={{ backgroundColor: config.color }}
      />
    </button>
  )
}
