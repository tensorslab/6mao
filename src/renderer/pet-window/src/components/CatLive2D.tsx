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
        await app.init({ backgroundAlpha: 0, width: 132, height: 76, antialias: true })
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

        model.scale.set(0.08)
        model.x = 66
        model.y = 8
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
      className="no-drag group relative grid h-[76px] w-[132px] cursor-pointer place-items-center overflow-hidden rounded-[28px] border-0 bg-transparent p-0"
      onClick={onClick}
      aria-label={`和 ${pet.name} 聊天`}
      title={`和 ${pet.name} 聊天`}
    >
      <div ref={hostRef} className="absolute inset-0 flex items-center justify-center" />
      {status !== 'Live2D ready' ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            className="pointer-events-none absolute bottom-0 h-16 w-16 translate-y-5 opacity-60 drop-shadow-xl"
            src={PERSONALITY_CONFIGS[pet.personality].spritePath}
            alt={pet.name}
            draggable={false}
          />
          <span className="pointer-events-none absolute bottom-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-[#2c2118] shadow">
            {status}
          </span>
        </div>
      ) : null}
      <span className="pointer-events-none relative z-10 max-w-[120px] truncate rounded-full border border-white/70 bg-white/95 px-4 py-2 text-sm font-black text-[#2c2118] shadow-lg backdrop-blur">
        {emotion === 'talk' ? '喵喵输入中' : pet.name}
      </span>
    </button>
  )
}
