import { Cat, Plus } from 'lucide-react'
import type { Pet } from '../api/types'

export function PetListPage({
  pets,
  loading,
  onSelect,
  onAdopt
}: {
  pets: Pet[]
  loading: boolean
  onSelect: (petId: string) => void
  onAdopt: () => void
}) {
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

      {loading ? <p className="rounded-3xl bg-white/60 p-4 text-sm">正在向猫窝探头...</p> : null}

      {pets.map((pet) => (
        <button
          key={pet.id}
          className="flex w-full items-center gap-3 rounded-[24px] border border-white/60 bg-white/75 p-4 text-left shadow-lg transition hover:-translate-y-0.5 hover:bg-white"
          onClick={() => onSelect(pet.id)}
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f4b860] text-white">
            <Cat />
          </div>
          <div>
            <h3 className="font-black text-[#2c2118]">{pet.name}</h3>
            <p className="text-sm font-semibold text-[#2c2118]/60">
              {pet.personality} · {new Date(pet.adoptedAt).toLocaleDateString()}
            </p>
          </div>
        </button>
      ))}

      {!loading && pets.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#f07f61]/40 bg-white/65 p-6 text-center">
          <p className="font-black text-[#2c2118]">猫窝暂时空空</p>
          <p className="mt-2 text-sm text-[#2c2118]/65">先收养一只，故事就会自己长出胡须。</p>
        </div>
      ) : null}
    </section>
  )
}
