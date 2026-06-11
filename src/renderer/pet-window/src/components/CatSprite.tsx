import type { PetRendererProps } from '../types'
import { PERSONALITY_CONFIGS } from '../personality'

export function CatSprite({
  pet,
  emotion,
  onClick,
  proactiveText,
  masterActive = false
}: PetRendererProps) {
  const config = PERSONALITY_CONFIGS[pet.personality]

  return (
    <button
      id="cat-sprite"
      className="no-drag group relative grid h-[76px] w-[132px] cursor-pointer place-items-center border-0 bg-transparent p-0"
      onClick={onClick}
      aria-label={`和 ${pet.name} 聊天`}
      title={`和 ${pet.name} 聊天`}
      style={{ ['--accent-current' as string]: config.color }}
    >
      {/* 主动行为气泡：毛玻璃 + 角色色小三角 */}
      {proactiveText ? (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full">
          <div
            className="rounded-token-lg bg-white/80 px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-float backdrop-blur-md"
            style={{ color: 'var(--ink-700)' }}
          >
            {proactiveText}
          </div>
          {/* 指向猫咪的小三角 */}
          <div
            className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-white/80 backdrop-blur-md"
            aria-hidden
          />
        </div>
      ) : null}

      {/* 名字气泡：前置角色色小圆点 */}
      <span className="pointer-events-none relative z-10 inline-flex max-w-[120px] items-center truncate rounded-full border border-white/70 bg-white/95 px-4 py-2 text-sm font-black text-[#2c2118] shadow-lg backdrop-blur">
        <span
          className="mr-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: config.color }}
          aria-hidden
        />
        <span className="truncate">{emotion === 'talk' ? '喵喵输入中' : pet.name}</span>
      </span>

      {/* 大师激活脉冲光环 */}
      {masterActive ? (
        <span
          className="pointer-events-none absolute bottom-0 left-1/2 z-0 h-20 w-20 -translate-x-1/2 translate-y-5 rounded-full animate-master-pulse"
          style={{
            backgroundColor: 'var(--accent-current-medium)',
            boxShadow: '0 0 24px var(--accent-current-medium)'
          }}
          aria-hidden
        />
      ) : null}

      <img
        className={`pointer-events-none absolute bottom-0 left-1/2 z-[1] h-36 w-36 -translate-x-1/2 translate-y-8 rounded-full object-cover drop-shadow-xl transition-transform duration-300 group-hover:scale-105 ${
          emotion === 'happy'
            ? 'animate-[bounce_0.8s_ease-in-out_infinite]'
            : emotion === 'sad'
              ? 'grayscale'
              : ''
        }`}
        src={config.spritePath}
        alt={config.displayName}
        draggable={false}
        onError={(event) => {
          const target = event.currentTarget
          if (!target.dataset.fallback) {
            target.dataset.fallback = '1'
            target.src = '/cats/placeholder-cat.svg'
          }
        }}
      />

      {/* 角色色阴影光晕：双层叠加（角色色底 + 主题色高亮） */}
      <span
        className="pointer-events-none absolute bottom-0 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full opacity-25 blur-md"
        style={{ backgroundColor: config.color }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-0 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full opacity-50 blur-sm"
        style={{ backgroundColor: 'var(--accent-current)' }}
        aria-hidden
      />
    </button>
  )
}
