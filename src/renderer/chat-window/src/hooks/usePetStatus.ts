import { useQuery } from '@tanstack/react-query'
import { getPetStatus } from '../api/pets'

export function usePetStatus(petId: string) {
  return useQuery({
    queryKey: ['pet-status', petId],
    queryFn: () => getPetStatus(petId),
    refetchInterval: 30_000,
    staleTime: 10_000,
    enabled: petId !== 'list',
    retry: 1
  })
}
