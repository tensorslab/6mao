import type { PetRendererProps } from '../types'
import { PERSONALITY_CONFIGS } from '../personality'

export function CatSprite({ pet, emotion, onClick }: PetRendererProps) {
  const config = PERSONALITY_CONFIGS[pet.personality]

  return (
    <button
      id="cat-sprite"
      className="no-drag group relative grid h-[76px] w-[132px] cursor-pointer place-items-center border-0 bg-transparent p-0"
      onClick={onClick}
      aria-label={`和 ${pet.name} 聊天`}
      title={`和 ${pet.name} 聊天`}
    >
      <span className="pointer-events-none relative z-10 max-w-[120px] truncate rounded-full border border-white/70 bg-white/95 px-4 py-2 text-sm font-black text-[#2c2118] shadow-lg backdrop-blur">
        {emotion === 'talk' ? '喵喵输入中' : pet.name}
      </span>
      <img
        className={`pointer-events-none absolute bottom-0 h-16 w-16 translate-y-5 opacity-60 drop-shadow-xl transition-transform duration-300 group-hover:scale-105 ${
          emotion === 'happy'
            ? 'animate-[bounce_0.8s_ease-in-out_infinite]'
            : emotion === 'sad'
              ? 'grayscale'
              : ''
        }`}
        src={config.spritePath}
        alt={config.displayName}
        draggable={false}
      />
      <span
        className="pointer-events-none absolute bottom-0 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full opacity-25 blur-md"
        style={{ backgroundColor: config.color }}
      />
    </button>
  )
}
