import { useQuery } from '@tanstack/react-query'
import { agentsApi } from '../api/agents'

export function useAgentsList(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['agents', 'list', params],
    queryFn: () => agentsApi.list(params),
    staleTime: 60_000,
  })
}

export function useAgentDetail(id: string) {
  return useQuery({
    queryKey: ['agents', 'detail', id],
    queryFn: () => agentsApi.getById(id),
    enabled: !!id,
    staleTime: 60_000,
  })
}
