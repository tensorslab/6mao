import { useQuery } from '@tanstack/react-query'
import { getOwnerPets } from '../api/pets'

export function useOwnerPets(ownerId: string) {
  return useQuery({
    queryKey: ['owner-pets', ownerId],
    queryFn: () => getOwnerPets(ownerId),
    retry: 1
  })
}
