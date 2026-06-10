import { useEffect, useState } from 'react'
import type { PetEmotion, PetRenderMode } from '../../../shared/ipc-channels'
import { PetRenderer } from './components/PetRenderer'
import type { RenderPet } from './types'

const DEFAULT_PET: RenderPet = {
  id: 'demo-cat',
  name: '六毛',
  personality: 'genki'
}

const initialMode = (import.meta.env.VITE_PET_RENDERER ?? 'sprite') as PetRenderMode

export function App() {
  const [pet, setPet] = useState(DEFAULT_PET)
  const [emotion, setEmotion] = useState<PetEmotion>('idle')
  const [mode] = useState<PetRenderMode>(initialMode === 'live2d' ? 'live2d' : 'sprite')

  useEffect(() => {
    const removeEmotionListener = window.electronAPI.onPetEmotion((nextEmotion) => {
      setEmotion(nextEmotion)
      if (nextEmotion !== 'idle') {
        window.setTimeout(() => setEmotion('idle'), 1800)
      }
    })

    return removeEmotionListener
  }, [])

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
    setEmotion('happy')
  }

  return (
    <main className="flex h-full w-full items-center justify-center bg-transparent">
      <PetRenderer pet={pet} emotion={emotion} mode={mode} onClick={openChat} />
    </main>
  )
}
