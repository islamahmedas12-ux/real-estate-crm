import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard'
import type { DateRangeParams } from '../types/dashboard'

export function useOverview(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'overview', params],
    queryFn: () => dashboardApi.getOverview(params),
    staleTime: 60_000,
  })
}

export function useRevenue(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'revenue', params],
    queryFn: () => dashboardApi.getRevenue(params),
    staleTime: 120_000,
  })
}

export function useLeads(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'leads', params],
    queryFn: () => dashboardApi.getLeads(params),
    staleTime: 60_000,
  })
}

export function useProperties() {
  return useQuery({
    queryKey: ['dashboard', 'properties'],
    queryFn: () => dashboardApi.getProperties(),
    staleTime: 120_000,
  })
}

export function useAgents(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'agents', params],
    queryFn: () => dashboardApi.getAgents(params),
    staleTime: 60_000,
  })
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: () => dashboardApi.getRecent(),
    staleTime: 30_000,
  })
}
