import apiClient from './client'
import type {
  Contract,
  ContractDetail,
  ContractFilter,
  ContractStats,
  Invoice,
  PaginatedResponse,
} from '../types'

const BASE = '/api/contracts'

export const contractsApi = {
  list(filter?: ContractFilter) {
    return apiClient
      .get<PaginatedResponse<Contract>>(BASE, { params: filter })
      .then((r) => r.data)
  },

  getById(id: string) {
    return apiClient.get<ContractDetail>(`${BASE}/${id}`).then((r) => r.data)
  },

  getStats() {
    return apiClient.get<ContractStats>(`${BASE}/stats`).then((r) => r.data)
  },

  getExpiring(days = 30) {
    return apiClient
      .get<Contract[]>(`${BASE}/expiring`, { params: { days } })
      .then((r) => r.data)
  },

  getInvoices(id: string) {
    return apiClient
      .get<Invoice[]>(`${BASE}/${id}/invoices`)
      .then((r) => r.data)
  },
}
