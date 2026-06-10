import type { PetStatus } from '../api/types'

const fallbackStatus: PetStatus = {
  bond: 32,
  stats: {
    hunger: 18,
    happiness: 76,
    energy: 64,
    cleanliness: 82
  },
  soul: {
    mood: '好奇地盯着你',
    trait: '会在你忙的时候假装不在意'
  }
}

const statLabels: Record<keyof PetStatus['stats'], string> = {
  hunger: '饥饿',
  happiness: '快乐',
  energy: '精力',
  cleanliness: '干净'
}

export function StatusPanel({
  status,
  loading
}: {
  status?: PetStatus
  loading: boolean
}) {
  const view = status ?? fallbackStatus

  return (
    <section className="rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-xl shadow-[#2c2118]/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7abf9e]">Bond</p>
          <h2 className="text-2xl font-black text-[#2c2118]">{view.bond}%</h2>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#f4b860] text-lg font-black text-white shadow-lg">
          {loading ? '...' : '喵'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(Object.keys(view.stats) as Array<keyof PetStatus['stats']>).map((key) => (
          <div key={key} className="rounded-2xl bg-[#fff7e8] p-3">
            <div className="flex justify-between text-xs font-bold text-[#2c2118]/70">
              <span>{statLabels[key]}</span>
              <span>{view.stats[key]}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#f07f61]"
                style={{ width: `${Math.max(0, Math.min(100, view.stats[key]))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-[#192133] px-4 py-3 text-sm font-semibold leading-relaxed text-white">
        {view.soul.mood}，{view.soul.trait}。
      </p>
    </section>
  )
}
