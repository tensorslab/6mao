import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Cat, List } from 'lucide-react'
import { WindowTitleBar } from './components/WindowTitleBar'
import { useOwnerPets } from './hooks/useOwnerPets'
import { usePetStatus } from './hooks/usePetStatus'
import { useAppStore } from './store/appStore'
import { AdoptPage } from './pages/AdoptPage'
import { ChatPage } from './pages/ChatPage'
import { PetListPage } from './pages/PetListPage'
import type { Pet } from './api/types'
import { releasePet } from './api/pets'

const demoPet: Pet = {
  pet_id: 'demo-cat',
  name: '六毛',
  personality: 'genki',
  created_at: new Date().toISOString(),
  owner_id: 'local-owner',
  bond_stage: 'Preview'
}

type View = 'chat' | 'list' | 'adopt'

export function App() {
  const queryClient = useQueryClient()
  const { ownerId, currentPetId, setCurrentPetId } = useAppStore()
  const [view, setView] = useState<View>('list')
  const petsQuery = useOwnerPets(ownerId)
  const pets = useMemo(() => petsQuery.data ?? [demoPet], [petsQuery.data])
  const activePet = pets.find((pet) => pet.pet_id === currentPetId) ?? pets[0]
  const statusQuery = usePetStatus(activePet?.pet_id ?? 'list')
  const releaseMutation = useMutation({
    mutationFn: (pet: Pet) => releasePet(ownerId, pet.pet_id),
    onSuccess: (_result, pet) => {
      queryClient.invalidateQueries({ queryKey: ['owner-pets', ownerId] })
      queryClient.removeQueries({ queryKey: ['pet-status', pet.pet_id] })
      if (currentPetId === pet.pet_id) {
        setCurrentPetId('demo-cat')
        setView('list')
      }
    }
  })

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

  useEffect(() => {
    if (!activePet) return
    window.electronAPI.setCurrentPet({ petId: activePet.pet_id, name: activePet.name })
  }, [activePet])

  const selectPet = (petId: string): void => {
    setCurrentPetId(petId)
    setView('chat')
  }

  const handleRelease = (pet: Pet): void => {
    const confirmed = window.confirm(`确定要释放 ${pet.name} 吗？这个操作不能撤销。`)
    if (!confirmed) return
    releaseMutation.mutate(pet)
  }

  return (
    <main className="flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffe6b7,transparent_35%),linear-gradient(145deg,#fff7e8,#f5d9c6_52%,#b8d9ca)] text-[#2c2118]">
      <WindowTitleBar />

      <div className="flex items-center gap-2 px-4 py-3">
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-black transition ${
            view === 'chat' ? 'bg-[#2c2118] text-white shadow-lg' : 'bg-white/55 text-[#2c2118]'
          }`}
          onClick={() => setView(activePet ? 'chat' : 'list')}
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
              setCurrentPetId(pet.pet_id)
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
            onRelease={handleRelease}
            releasingPetId={releaseMutation.variables?.pet_id ?? null}
          />
        ) : null}

        {view === 'chat' ? (
          activePet ? (
            <ChatPage
              petId={activePet.pet_id}
              ownerId={ownerId}
              status={statusQuery.data}
              statusLoading={statusQuery.isLoading}
            />
          ) : (
            <PetListPage
              pets={pets}
              loading={petsQuery.isLoading}
              onSelect={selectPet}
              onAdopt={() => setView('adopt')}
              onRelease={handleRelease}
              releasingPetId={releaseMutation.variables?.pet_id ?? null}
            />
          )
        ) : null}
      </div>
    </main>
  )
}
