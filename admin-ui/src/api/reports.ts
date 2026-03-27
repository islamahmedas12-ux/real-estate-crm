import apiClient from './client'
import type {
  RevenueReportParams,
  RevenueReportResponse,
  LeadConversionParams,
  LeadConversionResponse,
  PropertyReportResponse,
} from '../types/reports'

const BASE = '/api/reports'

export const reportsApi = {
  getRevenue(params?: RevenueReportParams) {
    return apiClient
      .get<RevenueReportResponse>(`${BASE}/revenue`, { params })
      .then((r) => r.data)
  },

  getLeadConversion(params?: LeadConversionParams) {
    return apiClient
      .get<LeadConversionResponse>(`${BASE}/leads/conversion`, { params })
      .then((r) => r.data)
  },

  getProperties() {
    return apiClient
      .get<PropertyReportResponse>(`${BASE}/properties`)
      .then((r) => r.data)
  },

  exportRevenueCsv(params?: RevenueReportParams) {
    return apiClient
      .get(`${BASE}/revenue/export`, {
        params,
        responseType: 'blob',
      })
      .then((r) => r.data)
  },

  exportLeadsCsv(params?: LeadConversionParams) {
    return apiClient
      .get(`${BASE}/leads/export`, {
        params,
        responseType: 'blob',
      })
      .then((r) => r.data)
  },
}
