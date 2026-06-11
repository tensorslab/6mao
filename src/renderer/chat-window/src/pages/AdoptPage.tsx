import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adoptPet } from '../api/adopt'
import { useOwnerPets } from '../hooks/useOwnerPets'
import type { Pet } from '../api/types'

const templates = [
  {
    id: 'cat-default',
    label: 'Balanced',
    description: '均衡、稳定，适合第一只桌面猫咪。',
    theatre: '（蹭了蹭你的手）你好呀，以后请多指教啦～',
    btnText: '确认带均衡小猫咪回家'
  },
  {
    id: 'cat-tsundere',
    label: 'Tsundere',
    description: '嘴硬但会偷偷陪着你。',
    theatre: '（耳朵抖了抖，别过脸）谁、谁要陪你啊… 不过你要是想说话，我也不是不能听…',
    btnText: '确认带傲娇小猫咪回家'
  },
  {
    id: 'cat-clingy',
    label: 'Clingy',
    description: '黏人，随时准备贴贴。',
    theatre: '（用脑袋蹭你的手心）终于见到你啦！我可以一直黏着你吗？',
    btnText: '确认带黏人小猫咪回家'
  },
  {
    id: 'cat-social',
    label: 'Social',
    description: '外向，喜欢热闹和互动。',
    theatre: '（摇着尾巴凑过来）嗨！以后这里就是我的地盘啦，一起玩呀！',
    btnText: '确认带社牛小猫咪回家'
  },
  {
    id: 'cat-philosopher',
    label: 'Philosopher',
    description: '会把纸箱思考成宇宙。',
    theatre: '（盯着纸箱发呆）你说… 纸箱的另一边，会不会有另一个世界？',
    btnText: '确认和哲学家猫咪回家'
  },
  {
    id: 'cat-mischief',
    label: 'Mischievous',
    description: '淘气，可能会把事情变有趣。',
    theatre: '（叼着逗猫棒跑过来）来抓我呀！抓到我就给你摸～',
    btnText: '确认带淘气小猫咪回家'
  },
  {
    id: 'cat-lazy',
    label: 'Lazy',
    description: '懒洋洋，但很会陪伴。',
    theatre: '（打了个哈欠，趴在你手边）终于有软乎乎的地方可以躺啦…',
    btnText: '确认带懒懒小猫咪回家'
  }
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
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const selectedTemplate = templates.find((t) => t.id === templateId)

  const { data: existingPets } = useOwnerPets(ownerId)
  const isMaxPets = useMemo(() => (existingPets?.length ?? 0) >= 3, [existingPets])
  
  const isDuplicateName = useMemo(() => {
    const trimmed = name.trim()
    if (!trimmed || !existingPets) return false
    return existingPets.some((pet) => pet.name === trimmed)
  }, [name, existingPets])

  const mutation = useMutation({
    mutationFn: () =>
      adoptPet({ owner_id: ownerId, species: 'cat', template: templateId!, name }),
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
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#2c2118]/70">给猫咪起名</span>
          {name.trim() && !isDuplicateName && (
            <span className="text-[10px] font-bold text-[#f4b860]">✨ 这个名字和 TA 很配！</span>
          )}
        </div>
        <input
          className={`mt-2 w-full rounded-2xl border bg-white/80 px-4 py-3 font-bold outline-none transition focus:ring-4 disabled:opacity-50 ${
            isDuplicateName
              ? 'border-[#f07f61] ring-[#f07f61]/20'
              : name.trim()
                ? 'border-[#f4b860] ring-[#f4b860]/20'
                : 'border-white/70 ring-[#f4b860]/20'
          }`}
          value={name}
          disabled={isMaxPets}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(event) => setName(event.target.value)}
          placeholder="比如：六毛"
        />
        <div className="mt-1 flex min-h-[1.25rem] items-center justify-between px-1">
          {isDuplicateName ? (
            <p className="text-xs font-bold text-[#f07f61]">已有同名猫咪，请换一个名字</p>
          ) : (
            <p className="text-xs font-bold text-[#2c2118]/40">
              {name.trim() ? `🐾 ${name.trim()} 正在等待领养` : ''}
            </p>
          )}
        </div>
      </label>

      <div className="grid gap-2">
        {templates.map((template) => {
          const isSelected = templateId === template.id
          const isOthersSelected = templateId !== null && !isSelected

          return (
            <div key={template.id} className="group relative">
              <button
                className={`w-full rounded-3xl border p-4 text-left transition-all duration-300 ${
                  isSelected
                    ? 'scale-[1.02] border-[#f07f61] bg-[#fff7e8] shadow-lg'
                    : `border-white/70 bg-white/65 ${isOthersSelected ? 'opacity-60' : 'hover:bg-white'}`
                }`}
                onClick={() => setTemplateId(template.id)}
              >
                <div className="flex items-center justify-between">
                  <p className="font-black text-[#2c2118]">{template.label}</p>
                  {isSelected && <span className="text-xl">✨</span>}
                </div>
                <p className="mt-1 text-sm font-semibold text-[#2c2118]/60">
                  {template.description}
                </p>
              </button>
              {isSelected && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1 px-4 py-2">
                  <p className="text-xs font-bold italic text-[#f07f61]">{template.theatre}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {mutation.error ? (
        <div className="rounded-2xl bg-[#f07f61]/15 p-4 text-sm font-bold text-[#9d2f1c]">
          {mutation.error instanceof Error && mutation.error.message.includes('max pets reached') ? (
            <div className="space-y-2">
              <p>😿 抱歉，你的喵窝已经挤满啦（上限 3 只）。</p>
              <p className="text-xs opacity-70">如果你想领养新的猫咪，请先在喵窝中释放一只猫咪。每一个离别都是为了更好的相遇。</p>
            </div>
          ) : (
            mutation.error instanceof Error ? mutation.error.message : '收养失败'
          )}
        </div>
      ) : null}

      <button
        className={`w-full rounded-2xl px-4 py-3 font-black text-white shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 ${
          isMaxPets ? 'bg-[#9d2f1c]/40' : templateId ? 'bg-[#f07f61]' : 'bg-[#2c2118]'
        }`}
        disabled={!name.trim() || isDuplicateName || !templateId || mutation.isPending || isMaxPets}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-pulse">正在递交猫爪印...</span>
          </span>
        ) : isMaxPets ? (
          '喵窝已满 (3/3)'
        ) : templateId ? (
          selectedTemplate?.btnText
        ) : (
          '请先选择 TA 的性格'
        )}
      </button>

      {isMaxPets && (
        <p className="mt-2 text-center text-xs font-bold text-[#9d2f1c]/60">
          每一个离别都是为了更好的相遇。释放猫咪后可领养新伙伴。
        </p>
      )}
    </section>
  )
}
