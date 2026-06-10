import { X } from 'lucide-react'

export function WindowTitleBar() {
  return (
    <header className="drag-region flex h-12 items-center justify-between border-b border-white/40 bg-white/45 px-4 backdrop-blur-xl">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f07f61]">6mao</p>
        <h1 className="-mt-1 text-lg font-black text-[#2c2118]">桌面猫咪</h1>
      </div>
      <button
        className="no-drag rounded-full bg-[#2c2118] p-2 text-white transition hover:scale-105 hover:bg-[#f07f61]"
        onClick={() => window.electronAPI.closeChat()}
        aria-label="关闭聊天窗口"
      >
        <X size={16} />
      </button>
    </header>
  )
}
