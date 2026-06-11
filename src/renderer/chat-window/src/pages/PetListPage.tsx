import { Plus, Trash2 } from 'lucide-react'
import type { Pet } from '../api/types'
import {
  CHARACTER_AVATARS,
  CHARACTER_AVATAR_FALLBACK,
  CHARACTER_COLORS,
  resolveCharacterProfile
} from '../store/appStore'

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
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-fg">我的猫咪</h2>
        <button
          className="flex items-center gap-1 rounded-token-lg bg-accent px-3 py-2 text-sm font-black text-white shadow-card transition hover:opacity-90 hover:scale-105"
          onClick={onAdopt}
        >
          <Plus size={16} />
          收养
        </button>
      </div>

      {loading ? (
        <p className="rounded-token-lg bg-white/60 p-4 text-sm text-fg">正在向猫窝探头...</p>
      ) : null}

      {pets.map((pet) => {
        const profile = resolveCharacterProfile(pet.template ?? pet.personality)
        const accent = CHARACTER_COLORS[profile.characterId]
        return (
          <div
            key={pet.pet_id}
            className="flex w-full items-center gap-3 rounded-token-lg border border-white/60 p-4 text-left shadow-card transition hover:-translate-y-0.5"
            style={{ backgroundColor: `${accent}20` }}
          >
            <button
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              onClick={() => onSelect(pet.pet_id)}
            >
              <div
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-token-md shadow-card ring-2 ring-white/70"
                style={{ backgroundColor: `${accent}33` }}
              >
                <img
                  src={CHARACTER_AVATARS[profile.characterId]}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                  draggable={false}
                  onError={(event) => {
                    const target = event.currentTarget
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = '1'
                      target.src = CHARACTER_AVATAR_FALLBACK
                    }
                  }}
                />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-black text-fg">{pet.name}</h3>
                <p className="truncate text-sm font-semibold text-[var(--ink-700)]/60">
                  {profile.title} · {pet.bond_stage ?? 'New'}
                </p>
              </div>
            </button>
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-token-md bg-white/70 text-fg transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="rounded-token-xl border border-dashed border-[var(--accent-current)]/40 bg-white/65 p-6 text-center">
          <p className="font-black text-fg">猫窝暂时空空</p>
          <p className="mt-2 text-sm text-[var(--ink-700)]/65">
            先收养一只，故事就会自己长出胡须。
          </p>
        </div>
      ) : null}
    </section>
  )
}
