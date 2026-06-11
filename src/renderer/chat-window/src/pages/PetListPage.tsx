import { Plus, Trash2 } from 'lucide-react'
import type { Pet } from '../api/types'
import blackAndWhiteCatPreview from '../../../../../resources/black_and_white/cat.png?url'
import yellowCatPreview from '../../../../../resources/yellow_cat/cat.png?url'

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

export function PetListPage({
  pets,
  loading,
  onSelect,
  onAdopt,
  onRelease,
  releasingPetId
}: {
  pets: Pet[]
  loading: boolean
  onSelect: (petId: string) => void
  onAdopt: () => void
  onRelease: (pet: Pet) => void
  releasingPetId?: string | null
}) {
  const isNewMember = (pet: Pet) => {
    if (!pet.created_at) return false
    const createdDate = new Date(pet.created_at)
    const now = new Date()
    const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24)
    return diffDays <= 3
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#2c2118]">我的猫咪</h2>
        <button
          className="flex items-center gap-1 rounded-full bg-[#f07f61] px-3 py-2 text-sm font-black text-white shadow-lg transition hover:scale-105"
          onClick={onAdopt}
        >
          <Plus size={16} />
          收养
        </button>
      </div>

      {loading ? <p className="rounded-3xl bg-white/60 p-4 text-sm">正在向喵窝探头...</p> : null}

      {pets.map((pet) => {
        const isNew = isNewMember(pet)
        return (
          <div
            key={pet.pet_id}
            className={`flex w-full items-center gap-3 rounded-[24px] border p-4 text-left shadow-lg transition hover:-translate-y-0.5 hover:bg-white group ${
              isNew
                ? 'animate-bounce-subtle border-[#f4b860] bg-[#fff7e8]'
                : 'border-white/60 bg-white/75'
            }`}
          >
            <button
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              onClick={() => onSelect(pet.pet_id)}
            >
              <div
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-2xl ${
                  isNew ? 'shadow-md shadow-[#f07f61]/20' : ''
                }`}
              >
                <img
                  src={getCatPreview(pet.template)}
                  alt={pet.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-black text-[#2c2118]">{pet.name}</h3>
                  {isNew && (
                    <span className="shrink-0 rounded-full bg-[#f4b860] px-2 py-0.5 text-[10px] font-black text-white">
                      新成员
                    </span>
                  )}
                </div>
                <p className="truncate text-sm font-semibold text-[#2c2118]/60">
                  {pet.bond_stage ?? pet.template ?? pet.personality ?? 'New'}
                </p>
              </div>
            </button>
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fff7e8] text-[#9d2f1c] transition hover:bg-[#f07f61] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={releasingPetId === pet.pet_id}
              onClick={() => onRelease(pet)}
              aria-label={`释放 ${pet.name}`}
              title={`释放 ${pet.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )
      })}

      {!loading && pets.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#f07f61]/40 bg-white/65 p-6 text-center">
          <p className="font-black text-[#2c2118]">喵窝暂时空空</p>
          <p className="mt-2 text-sm text-[#2c2118]/65">先收养一只，故事就会自己长出胡须。</p>
        </div>
      ) : null}
    </section>
  )
}
