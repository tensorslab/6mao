import { X } from 'lucide-react'
import { useAppStore } from '../store/appStore'

const CHARACTER_DISPLAY: Record<string, { name: string; title: string }> = {
  scholar: { name: '11', title: '喵掌柜' },
  tea: { name: '阿白', title: '茶艺·招待' },
  mechanic: { name: '阿铁', title: '器物·修补' },
  messenger: { name: '小橘', title: '跑堂·通信' },
  student: { name: '玄墨', title: '查书·检索' },
  artist: { name: '阿染', title: '作画·创意' }
}

export function WindowTitleBar() {
  const currentCharacterId = useAppStore((state) => state.currentCharacterId)
  const display = CHARACTER_DISPLAY[currentCharacterId] ?? CHARACTER_DISPLAY.scholar

  return (
    <header className="drag-region flex h-12 items-center justify-between border-b border-[var(--accent-current)]/20 bg-[var(--washi-50)]/80 px-4 backdrop-blur-xl">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--kaki-500)]">半山喵事处</p>
        <div className="-mt-1 flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-[var(--accent-current)]"
          />
          <h1 className="text-lg font-black text-[var(--ink-700)]">
            {display.name} · {display.title}
          </h1>
        </div>
      </div>
      <button
        className="no-drag rounded-full bg-[var(--ink-700)] p-2 text-white transition hover:scale-105 hover:bg-[var(--accent-current)]"
        onClick={() => window.electronAPI.closeChat()}
        aria-label="关闭聊天窗口"
      >
        <X size={16} />
      </button>
    </header>
  )
}
