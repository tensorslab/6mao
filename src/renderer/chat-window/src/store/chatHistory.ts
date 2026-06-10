import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage } from '../api/types'

interface ChatStore {
  histories: Record<string, ChatMessage[]>
  addMessage: (petId: string, message: ChatMessage) => void
  clearHistory: (petId: string) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      histories: {},
      addMessage: (petId, message) =>
        set((state) => ({
          histories: {
            ...state.histories,
            [petId]: [...(state.histories[petId] ?? []), message]
          }
        })),
      clearHistory: (petId) =>
        set((state) => ({
          histories: {
            ...state.histories,
            [petId]: []
          }
        }))
    }),
    { name: 'cat-chat-history' }
  )
)
