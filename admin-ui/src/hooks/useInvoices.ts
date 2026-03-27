import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '../api/invoices'
import type {
  InvoiceFilter,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  RecordPaymentPayload,
} from '../types/invoice'

const KEYS = {
  all: ['invoices'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (filter: InvoiceFilter) => [...KEYS.lists(), filter] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  stats: () => [...KEYS.all, 'stats'] as const,
  overdue: () => [...KEYS.all, 'overdue'] as const,
  upcoming: (days: number) => [...KEYS.all, 'upcoming', days] as const,
}

export function useInvoicesList(filter: InvoiceFilter) {
  return useQuery({
    queryKey: KEYS.list(filter),
    queryFn: () => invoicesApi.list(filter),
    staleTime: 30_000,
  })
}

export function useInvoiceDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => invoicesApi.getStats(),
    staleTime: 60_000,
  })
}

export function useOverdueInvoices() {
  return useQuery({
    queryKey: KEYS.overdue(),
    queryFn: () => invoicesApi.getOverdue(),
    staleTime: 60_000,
  })
}

export function useUpcomingInvoices(days = 30) {
  return useQuery({
    queryKey: KEYS.upcoming(days),
    queryFn: () => invoicesApi.getUpcoming(days),
    staleTime: 60_000,
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInvoicePayload) => invoicesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
      qc.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useUpdateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoicePayload }) =>
      invoicesApi.update(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecordPaymentPayload }) =>
      invoicesApi.recordPayment(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
      qc.invalidateQueries({ queryKey: KEYS.overdue() })
      qc.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useCancelInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoicesApi.cancel(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
    },
  })
}
