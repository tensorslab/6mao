import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  PetAction,
  PetDirection,
  PetEmotion,
  PetRenderMode
} from '../../../shared/ipc-channels'
import { PetRenderer } from './components/PetRenderer'
import type { RenderPet } from './types'

const DEFAULT_PET: RenderPet = {
  id: 'demo-cat',
  name: '黄猫',
  personality: 'scholar'
}

const initialMode = (import.meta.env.VITE_PET_RENDERER ?? 'sprite') as PetRenderMode

const PASSIVE_ACTIONS: PetAction[] = ['stand', 'sit', 'stretch', 'groom', 'lie', 'sleep', 'meow']

const EMOTION_ACTION: Partial<Record<PetEmotion, PetAction>> = {
  idle: 'stand',
  talk: 'meow',
  happy: 'jump',
  sad: 'lie',
  surprised: 'turn',
  thinking: 'sit',
  painting: 'groom',
  celebrate: 'jump',
  sleep: 'sleep',
  paw_wave: 'meow'
}

const PROACTIVE_ACTION: Record<string, PetAction> = {
  remind: 'meow',
  greet: 'meow',
  greeting: 'meow',
  walk: 'walk',
  run: 'run',
  turn: 'turn',
  sit: 'sit',
  lie: 'lie',
  sleep: 'sleep',
  stretch: 'stretch',
  groom: 'groom',
  jump: 'jump',
  meow: 'meow',
  shadow: 'shadow'
}

/** Duration map for non-idle emotions (ms) */
const EMOTION_DURATION: Record<string, number> = {
  idle: 0,
  talk: 2000,
  happy: 2500,
  sad: 3000,
  surprised: 1500,
  thinking: 0, // persistent until externally changed
  painting: 0, // persistent until master_done
  celebrate: 3000,
  sleep: 0, // persistent until externally changed
  paw_wave: 2000
}

export function App() {
  const [pet, setPet] = useState(DEFAULT_PET)
  const [emotion, setEmotion] = useState<PetEmotion>('idle')
  const [action, setAction] = useState<PetAction>('stand')
  const [direction, setDirection] = useState<PetDirection>('right')
  const [mode] = useState<PetRenderMode>(initialMode === 'live2d' ? 'live2d' : 'sprite')
  const [proactiveText, setProactiveText] = useState<string | null>(null)
  const emotionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMouseIgnoredRef = useRef(true)

  const setActionFor = useCallback((nextAction: PetAction, duration = 0): void => {
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current)
      actionTimerRef.current = null
    }

    setAction(nextAction)
    if (duration > 0) {
      actionTimerRef.current = setTimeout(() => setAction('stand'), duration)
    }
  }, [])

  /** Set emotion with auto-reset to idle after duration */
  const setEmotionWithDuration = useCallback(
    (nextEmotion: PetEmotion) => {
      if (emotionTimerRef.current) {
        clearTimeout(emotionTimerRef.current)
        emotionTimerRef.current = null
      }
      setEmotion(nextEmotion)
      setActionFor(EMOTION_ACTION[nextEmotion] ?? 'stand')
      const duration = EMOTION_DURATION[nextEmotion] ?? 2000
      if (duration > 0) {
        emotionTimerRef.current = setTimeout(() => setEmotion('idle'), duration)
      }
    },
    [setActionFor]
  )

  // Listen for emotion events from IPC (master events, proactive actions, etc.)
  useEffect(() => {
    const removeEmotionListener = window.electronAPI.onPetEmotion((nextEmotion) => {
      setEmotionWithDuration(nextEmotion)
    })

    return removeEmotionListener
  }, [setEmotionWithDuration])

  // Listen for pet switch events
  useEffect(() => {
    const removeSwitchListener = window.electronAPI.onPetSwitch((petId) => {
      setPet((current) => ({ ...current, id: petId }))
    })
    return removeSwitchListener
  }, [])

  // Listen for proactive behavior events (reminders, greetings)
  useEffect(() => {
    const removeActionListener = window.electronAPI.onPetAction((payload) => {
      setActionFor(payload.action)
      if (payload.direction) {
        setDirection(payload.direction)
      }
    })

    return removeActionListener
  }, [setActionFor])

  // Browser preview fallback: sample passive actions when no main process drives movement.
  useEffect(() => {
    if (!window.location.protocol.startsWith('http')) return

    const timer = window.setInterval(() => {
      const nextAction = PASSIVE_ACTIONS[Math.floor(Math.random() * PASSIVE_ACTIONS.length)]
      setActionFor(nextAction)
      setDirection((current) =>
        Math.random() > 0.8 ? (current === 'left' ? 'right' : 'left') : current
      )
    }, 6500)

    return () => window.clearInterval(timer)
  }, [setActionFor])

  useEffect(() => {
    const removeProactiveListener = window.electronAPI.onPetProactive((payload) => {
      if (payload.text && payload.text !== pet.name) {
        setProactiveText(payload.text)
        // Auto-dismiss after 5 seconds
        setTimeout(() => setProactiveText(null), 5000)
      }
      setActionFor(PROACTIVE_ACTION[payload.action] ?? 'meow')
    })
    return removeProactiveListener
  }, [pet.name, setActionFor])

  // Mouse penetration handling
  useEffect(() => {
    return window.electronAPI.onCurrentPet((currentPet) => {
      setPet((existing) => ({
        ...existing,
        id: currentPet.petId,
        name: currentPet.name
      }))
    })
  }, [])

  useEffect(() => {
    let frame = 0
    const setIgnoreMouse = (ignore: boolean) => {
      if (isMouseIgnoredRef.current === ignore) return

      isMouseIgnoredRef.current = ignore
      window.electronAPI.setIgnoreMouse(ignore)
    }

    const handleMouseMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const element = document.elementFromPoint(event.clientX, event.clientY)
        const onCat = element?.closest('#cat-sprite') !== null
        setIgnoreMouse(!onCat)
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const openChat = (): void => {
    isMouseIgnoredRef.current = false
    window.electronAPI.setIgnoreMouse(false)
    window.electronAPI.resumePetMotion()
    window.electronAPI.openChat(pet.id)
    setPet((current) => ({ ...current }))
    setEmotionWithDuration('happy')
    setActionFor('meow')
  }

  return (
    <main className="relative flex h-full w-full items-center justify-center overflow-hidden bg-transparent">
      <div className="relative h-[240px] w-[240px] shrink-0">
        <PetRenderer
          pet={pet}
          emotion={emotion}
          action={action}
          direction={direction}
          mode={mode}
          onClick={openChat}
          onActionComplete={(completedAction) => {
            if (completedAction === action) {
              setAction('stand')
            }
          }}
        />
      </div>

      {/* Proactive behavior speech bubble */}
      {proactiveText && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-[var(--washi-50)]/95 px-3 py-1.5 text-xs text-[var(--ink-700)] shadow-lg backdrop-blur-sm">
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[var(--washi-50)]/95" />
          {proactiveText}
        </div>
      )}
    </main>
  )
}
