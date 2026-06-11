import type { PetStatus } from '../api/types'
import blackAndWhiteCatPreview from '../../../../../resources/black_and_white/cat.png?url'
import yellowCatPreview from '../../../../../resources/yellow_cat/cat.png?url'

/** 后端 template → 猫咪外观预览图 */
const TEMPLATE_PREVIEW: Record<string, string> = {
  'cat-default': blackAndWhiteCatPreview,
  'cat-tsundere': blackAndWhiteCatPreview,
  'cat-philosopher': blackAndWhiteCatPreview,
  'cat-lazy': blackAndWhiteCatPreview,
  'cat-clingy': yellowCatPreview,
  'cat-social': yellowCatPreview,
  'cat-mischief': yellowCatPreview
}

function getCatPreview(template?: string): string {
  if (!template) return blackAndWhiteCatPreview
  return TEMPLATE_PREVIEW[template] ?? blackAndWhiteCatPreview
}

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

function toPercent(value: unknown): number {
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numericValue)) return 0
  return Math.max(0, Math.min(100, Math.round(numericValue * 100)))
}

export function StatusPanel({
  status,
  loading,
  template
}: {
  status?: PetStatus
  loading: boolean
  template?: string
}) {
  const view = status ?? fallbackStatus
  const stats = view.stats ?? fallbackStatus.stats
  const bondPercent = toPercent(view.bond?.score)
  const catPreview = getCatPreview(template)

  return (
    <section className="rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-xl shadow-[#2c2118]/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7abf9e]">Bond</p>
          <h2 className="text-2xl font-black text-[#2c2118]">{bondPercent}%</h2>
          <p className="text-xs font-bold text-[#2c2118]/55">{view.bond?.stage ?? 'Unknown'}</p>
        </div>
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full shadow-lg">
          {loading ? (
            <span className="text-lg font-black text-white">...</span>
          ) : (
            <img
              src={catPreview}
              alt={view.name ?? '猫咪'}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {visibleStatKeys.map((key) => {
          const percent = toPercent(stats[key])

          return (
            <div key={key} className="rounded-2xl bg-[#fff7e8] p-3">
              <div className="flex justify-between text-xs font-bold text-[#2c2118]/70">
                <span>{statLabels[key]}</span>
                <span>{percent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#f07f61]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
