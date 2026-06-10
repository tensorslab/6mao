import { useEffect, useMemo, useState } from 'react'
import { Cat, List } from 'lucide-react'
import { WindowTitleBar } from './components/WindowTitleBar'
import { useOwnerPets } from './hooks/useOwnerPets'
import { usePetStatus } from './hooks/usePetStatus'
import { useAppStore } from './store/appStore'
import { AdoptPage } from './pages/AdoptPage'
import { ChatPage } from './pages/ChatPage'
import { PetListPage } from './pages/PetListPage'
import type { Pet } from './api/types'

const demoPet: Pet = {
  id: 'demo-cat',
  name: '六毛',
  personality: 'genki',
  adoptedAt: new Date().toISOString(),
  ownerId: 'local-owner'
}

type View = 'chat' | 'list' | 'adopt'

export function App() {
  const { ownerId, currentPetId, setCurrentPetId } = useAppStore()
  const [view, setView] = useState<View>('chat')
  const petsQuery = useOwnerPets(ownerId)
  const pets = useMemo(() => petsQuery.data ?? [demoPet], [petsQuery.data])
  const activePet = pets.find((pet) => pet.id === currentPetId) ?? pets[0] ?? demoPet
  const statusQuery = usePetStatus(activePet.id)

  useEffect(() => {
    return window.electronAPI.onPetSwitch((petId) => {
      if (petId === 'list') {
        setView('list')
        return
      }

      setCurrentPetId(petId)
      setView('chat')
    })
  }, [setCurrentPetId])

  const selectPet = (petId: string): void => {
    setCurrentPetId(petId)
    setView('chat')
  }

  return (
    <main className="flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffe6b7,transparent_35%),linear-gradient(145deg,#fff7e8,#f5d9c6_52%,#b8d9ca)] text-[#2c2118]">
      <WindowTitleBar />

      <div className="flex items-center gap-2 px-4 py-3">
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-black transition ${
            view === 'chat' ? 'bg-[#2c2118] text-white shadow-lg' : 'bg-white/55 text-[#2c2118]'
          }`}
          onClick={() => setView('chat')}
        >
          <Cat size={16} />
          聊天
        </button>
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-black transition ${
            view === 'list' ? 'bg-[#2c2118] text-white shadow-lg' : 'bg-white/55 text-[#2c2118]'
          }`}
          onClick={() => setView('list')}
        >
          <List size={16} />
          列表
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {view === 'adopt' ? (
          <AdoptPage
            ownerId={ownerId}
            onAdopted={(pet) => {
              setCurrentPetId(pet.id)
              setView('chat')
            }}
          />
        ) : null}

        {view === 'list' ? (
          <PetListPage
            pets={pets}
            loading={petsQuery.isLoading}
            onSelect={selectPet}
            onAdopt={() => setView('adopt')}
          />
        ) : null}

        {view === 'chat' ? (
          <ChatPage
            petId={activePet.id}
            status={statusQuery.data}
            statusLoading={statusQuery.isLoading}
          />
        ) : null}
      </div>
    </main>
  )
}
