import apiClient from './client'
import type { PaginatedResponse } from '../types'
import type {
  Client,
  ClientDetail,
  ClientHistory,
  ClientFilter,
  ClientStats,
  CreateClientPayload,
  UpdateClientPayload,
} from '../types/client'

const BASE = '/api/clients'

export const clientsApi = {
  list(filter?: ClientFilter) {
    return apiClient
      .get<PaginatedResponse<Client>>(BASE, { params: filter })
      .then((r) => r.data)
  },

  getById(id: string) {
    return apiClient.get<ClientDetail>(`${BASE}/${id}`).then((r) => r.data)
  },

  getStats() {
    return apiClient.get<ClientStats>(`${BASE}/stats`).then((r) => r.data)
  },

  getHistory(id: string) {
    return apiClient.get<ClientHistory>(`${BASE}/${id}/history`).then((r) => r.data)
  },

  create(data: CreateClientPayload) {
    return apiClient.post<Client>(BASE, data).then((r) => r.data)
  },

  update(id: string, data: UpdateClientPayload) {
    return apiClient.put<Client>(`${BASE}/${id}`, data).then((r) => r.data)
  },

  remove(id: string) {
    return apiClient.delete(`${BASE}/${id}`).then((r) => r.data)
  },

  assignAgent(id: string, agentId: string) {
    return apiClient
      .patch<Client>(`${BASE}/${id}/assign`, { agentId })
      .then((r) => r.data)
  },
}
