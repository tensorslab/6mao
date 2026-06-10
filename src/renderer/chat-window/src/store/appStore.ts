import { create } from 'zustand'

interface AppStore {
  currentPetId: string
  ownerId: string
  setCurrentPetId: (petId: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentPetId: 'demo-cat',
  ownerId: import.meta.env.VITE_OWNER_ID ?? 'local-owner',
  setCurrentPetId: (petId) => set({ currentPetId: petId })
}))
