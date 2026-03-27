import apiClient from './client'
import type {
  Property,
  PropertyFilterParams,
  PropertyListResponse,
  CreatePropertyPayload,
  UpdatePropertyPayload,
  PropertyStatus,
} from '../types/property'

const BASE = '/api/properties'

export const propertiesApi = {
  list(params?: PropertyFilterParams) {
    return apiClient
      .get<PropertyListResponse>(BASE, { params })
      .then((r) => r.data)
  },

  search(q: string, cursor?: string, take = 20) {
    return apiClient
      .get<{ data: Property[]; nextCursor: string | null }>(`${BASE}/search`, {
        params: { q, cursor, take },
      })
      .then((r) => r.data)
  },

  get(id: string) {
    return apiClient.get<Property>(`${BASE}/${id}`).then((r) => r.data)
  },

  create(payload: CreatePropertyPayload) {
    return apiClient.post<Property>(BASE, payload).then((r) => r.data)
  },

  update(id: string, payload: UpdatePropertyPayload) {
    return apiClient.put<Property>(`${BASE}/${id}`, payload).then((r) => r.data)
  },

  delete(id: string) {
    return apiClient.delete(`${BASE}/${id}`).then((r) => r.data)
  },

  changeStatus(id: string, status: PropertyStatus) {
    return apiClient
      .patch<Property>(`${BASE}/${id}/status`, { status })
      .then((r) => r.data)
  },

  assignAgent(id: string, agentId: string) {
    return apiClient
      .patch<Property>(`${BASE}/${id}/assign`, { agentId })
      .then((r) => r.data)
  },
}
