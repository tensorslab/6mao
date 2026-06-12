import { create } from 'zustand'

const STORAGE_KEY = '6mao:ownerId'

/** 优先使用环境变量；未设置时生成 UUID 并持久化到 localStorage，保证同机器 ID 不变 */
function resolveOwnerId(): string {
  const envValue = import.meta.env.VITE_OWNER_ID
  if (envValue) return envValue

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return stored

  const generated = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY, generated)
  return generated
}

interface AppStore {
  currentPetId: string
  ownerId: string
  setCurrentPetId: (petId: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentPetId: 'demo-cat',
  ownerId: resolveOwnerId(),
  setCurrentPetId: (petId) => set({ currentPetId: petId })
}))
