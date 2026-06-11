import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adoptPet } from '../api/adopt'
import type { Pet } from '../api/types'
import {
  CHARACTER_AVATARS,
  CHARACTER_AVATAR_FALLBACK,
  CHARACTER_COLORS,
  TEMPLATE_TO_CHARACTER
} from '../store/appStore'

const TEMPLATE_ORDER: Array<keyof typeof TEMPLATE_TO_CHARACTER> = [
  'balanced',
  'tsundere',
  'clingy',
  'social',
  'philosopher',
  'mischievous',
  'lazy'
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
  const [templateId, setTemplateId] = useState<string>(TEMPLATE_ORDER[0])

  const mutation = useMutation({
    mutationFn: () => adoptPet({ owner_id: ownerId, species: 'cat', template: templateId, name }),
    onSuccess: (pet) => {
      queryClient.invalidateQueries({ queryKey: ['owner-pets', ownerId] })
      onAdopted(pet)
    }
  })

  const selectedProfile = TEMPLATE_TO_CHARACTER[templateId] ?? TEMPLATE_TO_CHARACTER.balanced
  const selectedAccent = CHARACTER_COLORS[selectedProfile.characterId]

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-accent">Adopt</p>
        <h2 className="text-2xl font-black text-fg">收养一只新猫咪</h2>
      </div>

      <label className="block">
        <span className="text-sm font-bold text-[var(--ink-700)]/70">给猫咪起名</span>
        <input
          className="mt-2 w-full rounded-token-md border bg-white/80 px-4 py-3 font-bold text-fg outline-none transition focus:ring-4"
          style={{
            borderColor: `${selectedAccent}4D`,
            // @ts-expect-error CSS custom property for tailwind ring color
            '--tw-ring-color': `${selectedAccent}66`
          }}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="比如：六毛"
        />
      </label>

      <div className="grid gap-2">
        <p className="text-sm font-bold text-[var(--ink-700)]/70">挑一位喵掌事</p>
        {TEMPLATE_ORDER.map((template) => {
          const profile = TEMPLATE_TO_CHARACTER[template]
          const accent = CHARACTER_COLORS[profile.characterId]
          const selected = templateId === template
          return (
            <button
              type="button"
              key={template}
              className={`rounded-token-lg p-3 border-2 text-left transition-all cursor-pointer ${
                selected
                  ? 'shadow-glow bg-accent-light'
                  : 'border-transparent bg-white/60 hover:bg-white/80'
              }`}
              style={{
                borderColor: selected ? accent : 'transparent'
              }}
              onClick={() => setTemplateId(template)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2"
                  style={{
                    backgroundColor: `${accent}26`,
                    borderColor: accent,
                    // @ts-expect-error CSS custom ring color via style
                    '--tw-ring-color': accent
                  }}
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="truncate font-medium text-fg">
                      {profile.name} · {profile.title}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--ink-700)]/50">{profile.props}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {mutation.error ? (
        <p className="rounded-token-md bg-accent-light p-3 text-sm font-bold text-fg">
          {mutation.error instanceof Error ? mutation.error.message : '收养失败'}
        </p>
      ) : null}

      <button
        className="w-full rounded-token-lg bg-accent px-4 py-3 font-black text-white shadow-card transition hover:opacity-90 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!name.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? '正在递交猫爪印...' : '确认收养'}
      </button>
    </section>
  )
}
