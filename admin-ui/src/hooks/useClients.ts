import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '../api/clients'
import type { ClientFilter, CreateClientPayload, UpdateClientPayload } from '../types/client'

const KEYS = {
  all: ['clients'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (filter: ClientFilter) => [...KEYS.lists(), filter] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  stats: () => [...KEYS.all, 'stats'] as const,
  history: (id: string) => [...KEYS.all, 'history', id] as const,
}

export function useClientsList(filter: ClientFilter) {
  return useQuery({
    queryKey: KEYS.list(filter),
    queryFn: () => clientsApi.list(filter),
    staleTime: 30_000,
  })
}

export function useClientDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useClientStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => clientsApi.getStats(),
    staleTime: 60_000,
  })
}

export function useClientHistory(id: string) {
  return useQuery({
    queryKey: KEYS.history(id),
    queryFn: () => clientsApi.getHistory(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClientPayload) => clientsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
    },
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientPayload }) =>
      clientsApi.update(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
    },
  })
}
