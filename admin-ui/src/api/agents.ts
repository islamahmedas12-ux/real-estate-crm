import apiClient from './client'
import type { PaginatedResponse } from '../types'
import type { Agent, AgentDetail } from '../types/reports'

const BASE = '/api/users'

export const agentsApi = {
  list(params?: { page?: number; limit?: number; search?: string }) {
    return apiClient
      .get<PaginatedResponse<Agent>>(BASE, {
        params: { ...params, role: 'AGENT' },
      })
      .then((r) => r.data)
  },

  getById(id: string) {
    return apiClient.get<AgentDetail>(`${BASE}/${id}`).then((r) => r.data)
  },

  toggleActive(id: string, isActive: boolean) {
    return apiClient
      .patch<Agent>(`${BASE}/${id}/status`, { isActive })
      .then((r) => r.data)
  },
}
