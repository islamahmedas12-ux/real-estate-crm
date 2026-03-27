import apiClient from './client'
import type {
  Client,
  ClientStats,
  CreateClientPayload,
  UpdateClientPayload,
  PaginatedResponse,
} from '../types'

export interface ClientListParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  source?: string
  assignedAgentId?: string
  sortBy?: 'createdAt' | 'firstName' | 'lastName'
  sortOrder?: 'asc' | 'desc'
}

export const clientsApi = {
  list: (params?: ClientListParams) =>
    apiClient.get<PaginatedResponse<Client>>('/api/clients', { params }).then((r) => r.data),

  stats: () =>
    apiClient.get<ClientStats>('/api/clients/stats').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Client>(`/api/clients/${id}`).then((r) => r.data),

  history: (id: string) =>
    apiClient.get<unknown[]>(`/api/clients/${id}/history`).then((r) => r.data),

  create: (data: CreateClientPayload) =>
    apiClient.post<Client>('/api/clients', data).then((r) => r.data),

  update: (id: string, data: UpdateClientPayload) =>
    apiClient.put<Client>(`/api/clients/${id}`, data).then((r) => r.data),

  assign: (id: string, agentId: string) =>
    apiClient.patch<Client>(`/api/clients/${id}/assign`, { agentId }).then((r) => r.data),
}
