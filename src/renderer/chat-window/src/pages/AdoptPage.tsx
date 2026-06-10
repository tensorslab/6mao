import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adoptPet } from '../api/adopt'
import type { Pet } from '../api/types'

const templates = [
  { id: 'cat-default', label: 'Balanced', description: '均衡、稳定，适合第一只桌面猫咪。' },
  { id: 'cat-tsundere', label: 'Tsundere', description: '嘴硬但会偷偷陪着你。' },
  { id: 'cat-clingy', label: 'Clingy', description: '黏人，随时准备贴贴。' },
  { id: 'cat-social', label: 'Social', description: '外向，喜欢热闹和互动。' },
  { id: 'cat-philosopher', label: 'Philosopher', description: '会把纸箱思考成宇宙。' },
  { id: 'cat-mischief', label: 'Mischievous', description: '淘气，可能会把事情变有趣。' },
  { id: 'cat-lazy', label: 'Lazy', description: '懒洋洋，但很会陪伴。' }
]

export function AdoptPage({
  ownerId,
  onAdopted
}: {
  ownerId: string
  onAdopted: (pet: Pet) => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('六毛')
  const [templateId, setTemplateId] = useState(templates[0].id)

  const mutation = useMutation({
    mutationFn: () => adoptPet({ owner_id: ownerId, species: 'cat', template: templateId, name }),
    onSuccess: (pet) => {
      queryClient.invalidateQueries({ queryKey: ['owner-pets', ownerId] })
      onAdopted(pet)
    }
  })

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f07f61]">Adopt</p>
        <h2 className="text-2xl font-black text-[#2c2118]">收养一只新猫咪</h2>
      </div>

      <label className="block">
        <span className="text-sm font-bold text-[#2c2118]/70">给猫咪起名</span>
        <input
          className="mt-2 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 font-bold outline-none ring-[#f4b860] transition focus:ring-4"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="比如：六毛"
        />
      </label>

      <div className="grid gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            className={`rounded-3xl border p-4 text-left transition ${
              templateId === template.id
                ? 'border-[#f07f61] bg-[#fff7e8] shadow-lg'
                : 'border-white/70 bg-white/65'
            }`}
            onClick={() => setTemplateId(template.id)}
          >
            <p className="font-black text-[#2c2118]">{template.label}</p>
            <p className="mt-1 text-sm font-semibold text-[#2c2118]/60">{template.description}</p>
          </button>
        ))}
      </div>

      {mutation.error ? (
        <p className="rounded-2xl bg-[#f07f61]/15 p-3 text-sm font-bold text-[#9d2f1c]">
          {mutation.error instanceof Error ? mutation.error.message : '收养失败'}
        </p>
      ) : null}

      <button
        className="w-full rounded-2xl bg-[#2c2118] px-4 py-3 font-black text-white shadow-xl transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!name.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? '正在递交猫爪印...' : '确认收养'}
      </button>
    </section>
  )
}
