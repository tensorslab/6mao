import type { PetRendererProps } from '../types'
import { PERSONALITY_CONFIGS } from '../personality'

export function CatSprite({ pet, emotion, onClick }: PetRendererProps) {
  const config = PERSONALITY_CONFIGS[pet.personality]

  return (
    <button
      id="cat-sprite"
      className="no-drag group relative h-[190px] w-[190px] cursor-pointer border-0 bg-transparent p-0"
      onClick={onClick}
      aria-label={`和 ${pet.name} 聊天`}
      title={`和 ${pet.name} 聊天`}
    >
      <span className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-bold text-[#2c2118] shadow-lg backdrop-blur">
        {emotion === 'talk' ? '喵喵输入中' : pet.name}
      </span>
      <img
        className={`h-full w-full drop-shadow-2xl transition-transform duration-300 group-hover:scale-105 ${
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
        className="absolute bottom-2 left-1/2 h-5 w-28 -translate-x-1/2 rounded-full opacity-30 blur-md"
        style={{ backgroundColor: config.color }}
      />
    </button>
  )
}
