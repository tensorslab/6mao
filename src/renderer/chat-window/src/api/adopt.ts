import { apiFetch } from './client'
import type { AdoptRequest, AdoptResponse, Pet } from './types'
import { getOwnerPets } from './pets'

const ADOPT_TIMEOUT_MS = 15_000

export function adoptPet(payload: AdoptRequest): Promise<Pet> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), ADOPT_TIMEOUT_MS)

  return apiFetch<AdoptResponse>('/api/adopt', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: controller.signal
  })
    .then((data) => {
      if (data.pet) return data.pet

      return {
        pet_id: data.pet_id ?? `${payload.owner_id}-${Date.now()}`,
        name: data.name ?? payload.name,
        species: payload.species,
        template: payload.template,
        bond_stage: 'New',
        owner_id: payload.owner_id
      }
    })
    .catch(async (error) => {
      if (!(error instanceof Error) || error.name !== 'AbortError') {
        throw error
      }

      const pets = await getOwnerPets(payload.owner_id)
      const adoptedPet = pets
        .filter((pet) => pet.name === payload.name && pet.template === payload.template)
        .at(-1)

      if (adoptedPet) {
        return adoptedPet
      }

      throw new Error('收养请求超时，且刷新宠物列表后没有找到新猫咪。请稍后重试。')
    })
    .finally(() => {
      window.clearTimeout(timeoutId)
    })
}
