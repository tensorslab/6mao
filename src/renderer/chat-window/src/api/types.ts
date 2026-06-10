export type Personality = 'tsundere' | 'genki' | 'sleepy' | 'cool' | 'gentle'

export interface Pet {
  id: string
  name: string
  personality: Personality
  adoptedAt: string
  ownerId: string
}

export interface PetStatus {
  bond: number
  stats: {
    hunger: number
    happiness: number
    energy: number
    cleanliness: number
  }
  soul: {
    mood: string
    trait: string
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AdoptRequest {
  ownerId: string
  petTemplateId: string
  name: string
}

export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  content: string
}
