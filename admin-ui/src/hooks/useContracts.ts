import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractsApi } from '../api/contracts'
import type {
  ContractFilter,
  CreateContractPayload,
  UpdateContractPayload,
  ChangeContractStatusPayload,
  GenerateInvoicesPayload,
} from '../types/contract'

const KEYS = {
  all: ['contracts'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (filter: ContractFilter) => [...KEYS.lists(), filter] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  stats: () => [...KEYS.all, 'stats'] as const,
  expiring: (days: number) => [...KEYS.all, 'expiring', days] as const,
  invoices: (id: string) => [...KEYS.all, 'invoices', id] as const,
}

export function useContractsList(filter: ContractFilter) {
  return useQuery({
    queryKey: KEYS.list(filter),
    queryFn: () => contractsApi.list(filter),
    staleTime: 30_000,
  })
}

export function useContractDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => contractsApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useContractStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => contractsApi.getStats(),
    staleTime: 60_000,
  })
}

export function useExpiringContracts(days = 30) {
  return useQuery({
    queryKey: KEYS.expiring(days),
    queryFn: () => contractsApi.getExpiring(days),
    staleTime: 60_000,
  })
}

export function useContractInvoices(id: string) {
  return useQuery({
    queryKey: KEYS.invoices(id),
    queryFn: () => contractsApi.getInvoices(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateContractPayload) => contractsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
    },
  })
}

export function useUpdateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractPayload }) =>
      contractsApi.update(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
}

export function useChangeContractStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangeContractStatusPayload }) =>
      contractsApi.changeStatus(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
    },
  })
}

export function useGenerateInvoices() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: GenerateInvoicesPayload }) =>
      contractsApi.generateInvoices(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: KEYS.invoices(id) })
      qc.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
