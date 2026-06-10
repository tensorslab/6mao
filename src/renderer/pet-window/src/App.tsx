import { useEffect, useRef, useState } from 'react'
import type { PetEmotion, PetRenderMode } from '../../../shared/ipc-channels'
import { PetRenderer } from './components/PetRenderer'
import type { RenderPet } from './types'

const DEFAULT_PET: RenderPet = {
  id: 'demo-cat',
  name: '11',
  personality: 'scholar'
}

const initialMode = (import.meta.env.VITE_PET_RENDERER ?? 'sprite') as PetRenderMode

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
  const [mode] = useState<PetRenderMode>(initialMode === 'live2d' ? 'live2d' : 'sprite')
  const [proactiveText, setProactiveText] = useState<string | null>(null)
  const emotionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Set emotion with auto-reset to idle after duration */
  const setEmotionWithDuration = (nextEmotion: PetEmotion) => {
    if (emotionTimerRef.current) {
      clearTimeout(emotionTimerRef.current)
      emotionTimerRef.current = null
    }
    setEmotion(nextEmotion)
    const duration = EMOTION_DURATION[nextEmotion] ?? 2000
    if (duration > 0) {
      emotionTimerRef.current = setTimeout(() => setEmotion('idle'), duration)
    }
  }

  // Listen for emotion events from IPC (master events, proactive actions, etc.)
  useEffect(() => {
    const removeEmotionListener = window.electronAPI.onPetEmotion((nextEmotion) => {
      setEmotionWithDuration(nextEmotion)
    })

    return removeEmotionListener
  }, [])

  // Listen for pet switch events
  useEffect(() => {
    const removeSwitchListener = window.electronAPI.onPetSwitch((petId) => {
      setPet((current) => ({ ...current, id: petId }))
    })
    return removeSwitchListener
  }, [])

  // Listen for proactive behavior events (reminders, greetings)
  useEffect(() => {
    const removeProactiveListener = window.electronAPI.onPetProactive((payload) => {
      if (payload.text) {
        setProactiveText(payload.text)
        // Auto-dismiss after 5 seconds
        setTimeout(() => setProactiveText(null), 5000)
      }
    })
    return removeProactiveListener
  }, [])

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

    const handleMouseMove = (event: MouseEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const element = document.elementFromPoint(event.clientX, event.clientY)
        const onCat = element?.closest('#cat-sprite') !== null
        window.electronAPI.setIgnoreMouse(!onCat)
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const openChat = (): void => {
    window.electronAPI.setIgnoreMouse(false)
    window.electronAPI.openChat(pet.id)
    setPet((current) => ({ ...current }))
    setEmotionWithDuration('happy')
  }

  return (
    <main className="relative flex h-full w-full items-center justify-center bg-transparent">
      <PetRenderer pet={pet} emotion={emotion} mode={mode} onClick={openChat} />

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
