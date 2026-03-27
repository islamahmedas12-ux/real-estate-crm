import apiClient from './client'
import type {
  DateRangeParams,
  OverviewResponse,
  RevenueResponse,
  LeadsResponse,
  PropertiesResponse,
  AgentsResponse,
  ActivityItem,
} from '../types/dashboard'

const BASE = '/api/dashboard/admin'

export const dashboardApi = {
  getOverview(params?: DateRangeParams) {
    return apiClient.get<OverviewResponse>(`${BASE}/overview`, { params }).then(r => r.data)
  },

  getRevenue(params?: DateRangeParams) {
    return apiClient.get<RevenueResponse>(`${BASE}/revenue`, { params }).then(r => r.data)
  },

  getLeads(params?: DateRangeParams) {
    return apiClient.get<LeadsResponse>(`${BASE}/leads`, { params }).then(r => r.data)
  },

  getProperties() {
    return apiClient.get<PropertiesResponse>(`${BASE}/properties`).then(r => r.data)
  },

  getAgents(params?: DateRangeParams) {
    return apiClient.get<AgentsResponse>(`${BASE}/agents`, { params }).then(r => r.data)
  },

  getRecent() {
    return apiClient.get<ActivityItem[]>(`${BASE}/recent`).then(r => r.data)
  },
}
