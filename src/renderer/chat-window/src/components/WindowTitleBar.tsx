import { X } from 'lucide-react'

export function WindowTitleBar() {
  return (
    <header className="drag-region flex h-12 items-center justify-between border-b border-[var(--washi-100)]/60 bg-[var(--washi-50)]/80 px-4 backdrop-blur-xl">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--kaki-500)]">
          半山喵事处
        </p>
        <h1 className="-mt-1 text-lg font-black text-[var(--ink-700)]">6mao</h1>
      </div>
      <button
        className="no-drag rounded-full bg-[var(--ink-700)] p-2 text-white transition hover:scale-105 hover:bg-[var(--kaki-500)]"
        onClick={() => window.electronAPI.closeChat()}
        aria-label="关闭聊天窗口"
      >
        <X size={16} />
      </button>
    </header>
  )
}
