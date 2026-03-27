import apiClient from './client'
import type {
  Property,
  PropertyStats,
  PropertyStatus,
  PaginatedResponse,
} from '../types'

export interface PropertyListParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  status?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  city?: string
  bedrooms?: number
  sortBy?: 'createdAt' | 'price' | 'area' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export const propertiesApi = {
  list: (params?: PropertyListParams) =>
    apiClient.get<PaginatedResponse<Property>>('/api/properties', { params }).then((r) => r.data),

  stats: () =>
    apiClient.get<PropertyStats>('/api/properties/stats').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Property>(`/api/properties/${id}`).then((r) => r.data),

  changeStatus: (id: string, status: PropertyStatus) =>
    apiClient.patch<Property>(`/api/properties/${id}/status`, { status }).then((r) => r.data),
}
