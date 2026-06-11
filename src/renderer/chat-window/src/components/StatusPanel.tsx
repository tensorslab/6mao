import type { PetStatus } from '../api/types'
import { useAppStore, type CharacterId } from '../store/appStore'

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

type VisibleStatKey = 'mood' | 'energy' | 'boredom'

const statLabels: Record<VisibleStatKey, string> = {
  mood: '心情',
  energy: '精力',
  boredom: '无聊'
}

const visibleStatKeys: VisibleStatKey[] = ['mood', 'energy', 'boredom']

/** 角色大师能力映射 */
const MASTER_SKILLS: Record<CharacterId, string> = {
  scholar: '主理·账房',
  tea: '茶艺·招待',
  mechanic: '器物·修补',
  messenger: '跑堂·通信',
  student: '查书·检索',
  artist: '作画·创意'
}

function toPercent(value: unknown): number {
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numericValue)) return 0
  return Math.max(0, Math.min(100, Math.round(numericValue * 100)))
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
  const bondPercent = toPercent(view.bond?.score)
  const currentCharacterId = useAppStore((s) => s.currentCharacterId)

  return (
    <section className="rounded-token-xl border border-white/60 bg-white/70 p-4 shadow-card backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-accent text-xs font-bold uppercase tracking-[0.2em]">Bond</p>
          <h2 className="text-fg text-2xl font-black">{bondPercent}%</h2>
          <p className="text-xs font-bold text-[var(--ink-700)]/55">{view.bond?.stage ?? 'Unknown'}</p>
        </div>
        <div className="bg-accent grid h-16 w-16 place-items-center rounded-full text-lg font-black text-white shadow-lg">
          {loading ? '...' : '喵'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {visibleStatKeys.map((key) => {
          const percent = toPercent(stats[key])

          return (
            <div key={key} className="rounded-2xl bg-[var(--washi-100)] p-3">
              <div className="flex justify-between text-xs font-bold text-[var(--ink-700)]/70">
                <span>{statLabels[key]}</span>
                <span>{percent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="bg-accent h-full rounded-full" style={{ width: `${percent}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span className="bg-accent h-1.5 w-1.5 rounded-full" />
        <span className="text-xs text-[var(--ink-700)]/60">
          技能：{MASTER_SKILLS[currentCharacterId]}
        </span>
      </div>
    </section>
  )
}
