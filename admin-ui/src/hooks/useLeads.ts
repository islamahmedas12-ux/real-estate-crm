import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsApi } from '../api/leads'
import type {
  LeadFilter,
  CreateLeadPayload,
  UpdateLeadPayload,
  ChangeStatusPayload,
  CreateActivityPayload,
} from '../types/lead'

const KEYS = {
  all: ['leads'] as const,
  lists: () => [...KEYS.all, 'list'] as const,
  list: (filter: LeadFilter) => [...KEYS.lists(), filter] as const,
  details: () => [...KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KEYS.details(), id] as const,
  stats: () => [...KEYS.all, 'stats'] as const,
  pipeline: () => [...KEYS.all, 'pipeline'] as const,
  activities: (id: string) => [...KEYS.all, 'activities', id] as const,
}

export function useLeadsList(filter: LeadFilter) {
  return useQuery({
    queryKey: KEYS.list(filter),
    queryFn: () => leadsApi.list(filter),
    staleTime: 30_000,
  })
}

export function useLeadDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useLeadStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => leadsApi.getStats(),
    staleTime: 60_000,
  })
}

export function useLeadPipeline() {
  return useQuery({
    queryKey: KEYS.pipeline(),
    queryFn: () => leadsApi.getPipeline(),
    staleTime: 15_000,
  })
}

export function useLeadActivities(id: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...KEYS.activities(id), page, limit],
    queryFn: () => leadsApi.getActivities(id, page, limit),
    enabled: !!id,
    staleTime: 15_000,
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateLeadPayload) => leadsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.pipeline() })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
    },
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadPayload }) =>
      leadsApi.update(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: KEYS.pipeline() })
    },
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.pipeline() })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
    },
  })
}

export function useChangeLeadStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangeStatusPayload }) =>
      leadsApi.changeStatus(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: KEYS.pipeline() })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
    },
  })
}

export function useConvertLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leadsApi.convert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.lists() })
      qc.invalidateQueries({ queryKey: KEYS.pipeline() })
      qc.invalidateQueries({ queryKey: KEYS.stats() })
      qc.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useAddLeadActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateActivityPayload }) =>
      leadsApi.addActivity(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.activities(id) })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
}
