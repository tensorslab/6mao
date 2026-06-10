import { apiFetch } from './client'
import type { OwnerPetsResponse, Pet, PetStatus } from './types'

export function getOwnerPets(ownerId: string): Promise<Pet[]> {
  return apiFetch<OwnerPetsResponse>(`/api/owner/${encodeURIComponent(ownerId)}/pets`).then(
    (data) => data.pets ?? []
  )
}

export function getPetStatus(petId: string): Promise<PetStatus> {
  return apiFetch<PetStatus>(`/api/pet/${encodeURIComponent(petId)}/status`)
}

export function releasePet(ownerId: string, petId: string): Promise<{ ok?: boolean }> {
  return apiFetch<{ ok?: boolean }>(`/api/pet/${encodeURIComponent(petId)}/release`, {
    method: 'POST',
    body: JSON.stringify({ owner_id: ownerId })
  })
}
