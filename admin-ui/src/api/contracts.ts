import apiClient from './client'
import type { PaginatedResponse } from '../types'
import type {
  Contract,
  ContractDetail,
  ContractFilter,
  ContractStats,
  CreateContractPayload,
  UpdateContractPayload,
  ChangeContractStatusPayload,
  GenerateInvoicesPayload,
} from '../types/contract'
import type { Invoice } from '../types/invoice'

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

  create(data: CreateContractPayload) {
    return apiClient.post<Contract>(BASE, data).then((r) => r.data)
  },

  update(id: string, data: UpdateContractPayload) {
    return apiClient.put<Contract>(`${BASE}/${id}`, data).then((r) => r.data)
  },

  changeStatus(id: string, data: ChangeContractStatusPayload) {
    return apiClient
      .patch<Contract>(`${BASE}/${id}/status`, data)
      .then((r) => r.data)
  },

  generateInvoices(id: string, data?: GenerateInvoicesPayload) {
    return apiClient
      .post<Invoice[]>(`${BASE}/${id}/generate-invoices`, data ?? {})
      .then((r) => r.data)
  },
}
