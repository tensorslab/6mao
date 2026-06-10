import { useEffect, useRef, useState } from 'react'
import type { PetRendererProps } from '../types'
import { PERSONALITY_CONFIGS } from '../personality'

export function CatLive2D({ pet, emotion, onClick }: PetRendererProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState('Live2D loading')

  useEffect(() => {
    let disposed = false
    let cleanup: (() => void) | undefined

    async function mountLive2D(): Promise<void> {
      const host = hostRef.current
      if (!host) return

      try {
        const [{ Application }, { Live2DModel }] = await Promise.all([
          import('pixi.js'),
          import('pixi-live2d-display')
        ])
        const app = new Application()
        await app.init({ backgroundAlpha: 0, width: 190, height: 190, antialias: true })
        if (disposed) {
          app.destroy()
          return
        }

        host.replaceChildren(app.canvas)
        const model = await Live2DModel.from(PERSONALITY_CONFIGS[pet.personality].modelPath)
        if (disposed) {
          app.destroy()
          return
        }

        model.scale.set(0.12)
        model.x = 95
        model.y = 20
        app.stage.addChild(model as never)
        setStatus('Live2D ready')

        cleanup = () => {
          app.destroy(true)
        }
      } catch {
        setStatus('Live2D asset missing, using placeholder')
      }
    }

    mountLive2D()

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [pet.personality])

  return (
    <button
      id="cat-sprite"
      className="no-drag group relative h-[190px] w-[190px] cursor-pointer overflow-hidden rounded-[44px] border-0 bg-transparent p-0"
      onClick={onClick}
      aria-label={`和 ${pet.name} 聊天`}
      title={`和 ${pet.name} 聊天`}
    >
      <div ref={hostRef} className="absolute inset-0 flex items-center justify-center" />
      {status !== 'Live2D ready' ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            className="h-full w-full drop-shadow-2xl"
            src={PERSONALITY_CONFIGS[pet.personality].spritePath}
            alt={pet.name}
            draggable={false}
          />
          <span className="absolute bottom-5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#2c2118] shadow">
            {status}
          </span>
        </div>
      ) : null}
      <span className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-bold text-[#2c2118] shadow-lg backdrop-blur">
        {emotion === 'talk' ? '喵喵输入中' : pet.name}
      </span>
    </button>
  )
}
