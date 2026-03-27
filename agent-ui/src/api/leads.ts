import apiClient from './client'
import type {
  Lead,
  LeadStats,
  LeadActivity,
  CreateLeadPayload,
  UpdateLeadPayload,
  PaginatedResponse,
} from '../types'

export interface LeadListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
  assignedAgentId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'createdAt' | 'priority' | 'nextFollowUp'
  sortOrder?: 'asc' | 'desc'
}

export const leadsApi = {
  list: (params?: LeadListParams) =>
    apiClient.get<PaginatedResponse<Lead>>('/api/leads', { params }).then((r) => r.data),

  pipeline: () =>
    apiClient.get<Record<string, Lead[]>>('/api/leads/pipeline').then((r) => r.data),

  stats: () =>
    apiClient.get<LeadStats>('/api/leads/stats').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Lead>(`/api/leads/${id}`).then((r) => r.data),

  create: (data: CreateLeadPayload) =>
    apiClient.post<Lead>('/api/leads', data).then((r) => r.data),

  update: (id: string, data: UpdateLeadPayload) =>
    apiClient.put<Lead>(`/api/leads/${id}`, data).then((r) => r.data),

  changeStatus: (id: string, status: string, notes?: string) =>
    apiClient.patch<Lead>(`/api/leads/${id}/status`, { status, notes }).then((r) => r.data),

  addActivity: (id: string, type: string, description: string) =>
    apiClient.post<LeadActivity>(`/api/leads/${id}/activities`, { type, description }).then((r) => r.data),

  getActivities: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<LeadActivity>>(`/api/leads/${id}/activities`, { params }).then((r) => r.data),
}
