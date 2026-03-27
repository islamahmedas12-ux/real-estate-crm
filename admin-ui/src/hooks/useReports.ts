import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../api/reports'
import type { RevenueReportParams, LeadConversionParams } from '../types/reports'

export function useRevenueReport(params?: RevenueReportParams) {
  return useQuery({
    queryKey: ['reports', 'revenue', params],
    queryFn: () => reportsApi.getRevenue(params),
    staleTime: 120_000,
  })
}

export function useLeadConversionReport(params?: LeadConversionParams) {
  return useQuery({
    queryKey: ['reports', 'lead-conversion', params],
    queryFn: () => reportsApi.getLeadConversion(params),
    staleTime: 120_000,
  })
}

export function usePropertyReport() {
  return useQuery({
    queryKey: ['reports', 'properties'],
    queryFn: () => reportsApi.getProperties(),
    staleTime: 120_000,
  })
}
