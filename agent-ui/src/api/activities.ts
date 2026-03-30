import apiClient from './client'
import type {
  Activity,
  ActivityFilter,
  ActivityEntityType,
  PaginatedResponse,
} from '../types'

const BASE = '/api/activities'

export const activitiesApi = {
  list(filter?: ActivityFilter) {
    return apiClient
      .get<PaginatedResponse<Activity>>(BASE, { params: filter })
      .then((r) => r.data)
  },

  recent(limit = 20) {
    return apiClient
      .get<PaginatedResponse<Activity>>(`${BASE}/recent`, { params: { limit } })
      .then((r) => r.data)
  },

  byEntity(type: ActivityEntityType, id: string, filter?: ActivityFilter) {
    return apiClient
      .get<PaginatedResponse<Activity>>(`${BASE}/entity/${type}/${id}`, {
        params: filter,
      })
      .then((r) => r.data)
  },

  byUser(userId: string, filter?: ActivityFilter) {
    return apiClient
      .get<PaginatedResponse<Activity>>(`${BASE}/user/${userId}`, {
        params: filter,
      })
      .then((r) => r.data)
  },
}
