import { apiFetch } from './client'
import type { Pet, PetStatus } from './types'

export function getOwnerPets(ownerId: string): Promise<Pet[]> {
  return apiFetch<Pet[]>(`/api/owner/${encodeURIComponent(ownerId)}/pets`)
}

export function getPetStatus(petId: string): Promise<PetStatus> {
  return apiFetch<PetStatus>(`/api/pet/${encodeURIComponent(petId)}/status`)
}
