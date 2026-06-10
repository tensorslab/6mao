import { apiFetch } from './client'
import type { AdoptRequest, Pet } from './types'

export function adoptPet(payload: AdoptRequest): Promise<Pet> {
  return apiFetch<Pet>('/api/adopt', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
