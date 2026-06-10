import type { PetStatus } from '../api/types'

const fallbackStatus: PetStatus = {
  name: '六毛',
  bond: {
    score: 0.32,
    stage: 'Preview'
  },
  stats: {
    mood: 0.76,
    energy: 0.64,
    boredom: 0.18
  },
  soul_summary: {
    personality_tags: ['好奇', '陪伴型'],
    tone: '好奇地盯着你，会在你忙的时候假装不在意。'
  }
}

const statLabels: Record<keyof PetStatus['stats'], string> = {
  mood: '心情',
  energy: '精力',
  boredom: '无聊'
}

export function StatusPanel({
  status,
  loading
}: {
  status?: PetStatus
  loading: boolean
}) {
  const view = status ?? fallbackStatus
  const stats = view.stats ?? fallbackStatus.stats
  const bondPercent = Math.round((view.bond?.score ?? 0) * 100)

  return (
    <section className="rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-xl shadow-[#2c2118]/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7abf9e]">Bond</p>
          <h2 className="text-2xl font-black text-[#2c2118]">{bondPercent}%</h2>
          <p className="text-xs font-bold text-[#2c2118]/55">{view.bond?.stage ?? 'Unknown'}</p>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#f4b860] text-lg font-black text-white shadow-lg">
          {loading ? '...' : '喵'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(Object.keys(stats) as Array<keyof PetStatus['stats']>).map((key) => (
          <div key={key} className="rounded-2xl bg-[#fff7e8] p-3">
            <div className="flex justify-between text-xs font-bold text-[#2c2118]/70">
              <span>{statLabels[key]}</span>
              <span>{Math.round((stats[key] ?? 0) * 100)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#f07f61]"
                style={{ width: `${Math.max(0, Math.min(100, (stats[key] ?? 0) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-[#192133] px-4 py-3 text-sm font-semibold leading-relaxed text-white">
        {(view.soul_summary?.personality_tags ?? []).join(' / ') || '猫咪档案'}：
        {view.soul_summary?.tone || '等待后端返回灵魂状态。'}
      </p>
    </section>
  )
}
