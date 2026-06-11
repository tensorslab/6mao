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
import { SuccessCelebration } from './components/SuccessCelebration'
import type { Pet } from './api/types'
import { releasePet } from './api/pets'
import { useChatStore } from './store/chatHistory'

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
  const addMessage = useChatStore((state) => state.addMessage)
  const [view, setView] = useState<View>('list')
  const [adoptedPet, setAdoptedPet] = useState<Pet | null>(null)

  const petsQuery = useOwnerPets(ownerId)
  const pets = useMemo(() => petsQuery.data ?? [demoPet], [petsQuery.data])
  const activePet = pets.find((pet) => pet.pet_id === currentPetId) ?? pets[0]
  const statusQuery = usePetStatus(activePet?.pet_id ?? 'list')

  const handleAdopted = (pet: Pet) => {
    // 准备开场白
    const greetings: Record<string, string> = {
      'cat-default': `喵～你好呀，我是 ${pet.name}，以后请多指教啦！`,
      'cat-tsundere': `哼… 既然你都收养我了，我就勉为其难陪你吧。`,
      'cat-clingy': `（蹭蹭屏幕）终于等到你啦！我是 ${pet.name}，要一直陪着我哦～`,
      'cat-social': `嗨！我是 ${pet.name}，以后我们就是伙伴啦！要不要一起找点好玩的？`,
      'cat-philosopher': `你好，我是 ${pet.name}。你有没有想过，桌面的尽头是什么？`,
      'cat-mischief': `嘿嘿，我是 ${pet.name}！以后无聊的时候，我可以给你找点乐子哦～`,
      'cat-lazy': `唔… 终于找到舒服的地方了。我是 ${pet.name}，别吵我，我先睡会儿…`
    }

    const greeting = greetings[pet.template || 'cat-default'] || greetings['cat-default']

    // 存入聊天历史
    addMessage(pet.pet_id, {
      role: 'assistant',
      content: greeting,
      timestamp: Date.now()
    })

    // 设置新领养的猫咪并显示庆祝界面
    setAdoptedPet(pet)
  }

  const handleStartChat = () => {
    if (adoptedPet) {
      setCurrentPetId(adoptedPet.pet_id)
      window.electronAPI.setCurrentPet({
        petId: adoptedPet.pet_id,
        name: adoptedPet.name,
        template: adoptedPet.template
      })
      setAdoptedPet(null)
      setView('chat')
    }
  }

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
      const pet = pets.find((p) => p.pet_id === petId)
      if (pet) {
        window.electronAPI.setCurrentPet({
          petId: pet.pet_id,
          name: pet.name,
          template: pet.template
        })
      }
      setView('chat')
    })
  }, [setCurrentPetId, pets])

  // 聊天窗口加载时或活跃猫咪变化时，通知宠物窗口更新外观
  // 仅在 pet_id 或 template 实际变化时触发，避免对象引用变化导致反复发送
  useEffect(() => {
    if (activePet?.pet_id && activePet?.template) {
      window.electronAPI.setCurrentPet({
        petId: activePet.pet_id,
        name: activePet.name,
        template: activePet.template
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePet?.pet_id, activePet?.template])

  const selectPet = (petId: string): void => {
    setCurrentPetId(petId)
    const pet = pets.find((p) => p.pet_id === petId)
    if (pet) {
      window.electronAPI.setCurrentPet({
        petId: pet.pet_id,
        name: pet.name,
        template: pet.template
      })
    }
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

      {adoptedPet && (
        <SuccessCelebration
          pet={adoptedPet}
          totalCount={pets.length}
          onStartChat={handleStartChat}
        />
      )}

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
          喵窝
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {view === 'adopt' ? (
          <AdoptPage ownerId={ownerId} onAdopted={handleAdopted} />
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
              template={activePet.template}
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
