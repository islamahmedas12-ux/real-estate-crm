import apiClient from './client'
import type { PaginatedResponse } from '../types'
import type {
  Lead,
  LeadDetail,
  LeadActivity,
  LeadFilter,
  LeadStats,
  PipelineData,
  CreateLeadPayload,
  UpdateLeadPayload,
  ChangeStatusPayload,
  CreateActivityPayload,
} from '../types/lead'

const BASE = '/api/leads'

export const leadsApi = {
  list(filter?: LeadFilter) {
    return apiClient
      .get<PaginatedResponse<Lead>>(BASE, { params: filter })
      .then((r) => r.data)
  },

  getById(id: string) {
    return apiClient.get<LeadDetail>(`${BASE}/${id}`).then((r) => r.data)
  },

  getStats() {
    return apiClient.get<LeadStats>(`${BASE}/stats`).then((r) => r.data)
  },

  getPipeline() {
    return apiClient.get<PipelineData>(`${BASE}/pipeline`).then((r) => r.data)
  },

  create(data: CreateLeadPayload) {
    return apiClient.post<Lead>(BASE, data).then((r) => r.data)
  },

  update(id: string, data: UpdateLeadPayload) {
    return apiClient.put<Lead>(`${BASE}/${id}`, data).then((r) => r.data)
  },

  remove(id: string) {
    return apiClient.delete(`${BASE}/${id}`).then((r) => r.data)
  },

  changeStatus(id: string, data: ChangeStatusPayload) {
    return apiClient
      .patch<Lead>(`${BASE}/${id}/status`, data)
      .then((r) => r.data)
  },

  assignAgent(id: string, agentId: string) {
    return apiClient
      .patch<Lead>(`${BASE}/${id}/assign`, { agentId })
      .then((r) => r.data)
  },

  addActivity(id: string, data: CreateActivityPayload) {
    return apiClient
      .post<LeadActivity>(`${BASE}/${id}/activities`, data)
      .then((r) => r.data)
  },

  getActivities(id: string, page = 1, limit = 20) {
    return apiClient
      .get<PaginatedResponse<LeadActivity>>(`${BASE}/${id}/activities`, {
        params: { page, limit },
      })
      .then((r) => r.data)
  },
}
