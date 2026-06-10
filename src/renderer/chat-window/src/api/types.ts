export type Personality = 'tsundere' | 'genki' | 'sleepy' | 'cool' | 'gentle' | string

export interface Pet {
  pet_id: string
  name: string
  species?: string
  template?: string
  personality?: Personality
  bond_stage?: string
  created_at?: string
  adopted_at?: string
  owner_id?: string
}

export interface OwnerPetsResponse {
  pets: Pet[]
}

export interface AdoptResponse {
  pet_id?: string
  pet?: Pet
  name?: string
  greeting?: string
}

export interface PetStatus {
  name: string
  bond?: {
    score?: number
    stage?: string
  }
  stats: {
    mood?: number
    energy?: number
    boredom?: number
  }
  soul_summary?: {
    personality_tags?: string[]
    tone?: string
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AdoptRequest {
  owner_id: string
  species: 'cat'
  template: string
  name: string
}

export interface ChatRequest {
  owner_id: string
  message: string
}

export interface ChatResponse {
  content: string
}
