import apiClient from './client'
import type { PaginatedResponse } from '../types'
import type {
  Invoice,
  InvoiceDetail,
  InvoiceFilter,
  InvoiceStats,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  RecordPaymentPayload,
} from '../types/invoice'

const BASE = '/api/invoices'

export const invoicesApi = {
  list(filter?: InvoiceFilter) {
    return apiClient
      .get<PaginatedResponse<Invoice>>(BASE, { params: filter })
      .then((r) => r.data)
  },

  getById(id: string) {
    return apiClient.get<InvoiceDetail>(`${BASE}/${id}`).then((r) => r.data)
  },

  getStats() {
    return apiClient.get<InvoiceStats>(`${BASE}/stats`).then((r) => r.data)
  },

  getOverdue() {
    return apiClient.get<Invoice[]>(`${BASE}/overdue`).then((r) => r.data)
  },

  getUpcoming(days = 30) {
    return apiClient
      .get<Invoice[]>(`${BASE}/upcoming`, { params: { days } })
      .then((r) => r.data)
  },

  create(data: CreateInvoicePayload) {
    return apiClient.post<Invoice>(BASE, data).then((r) => r.data)
  },

  update(id: string, data: UpdateInvoicePayload) {
    return apiClient.put<Invoice>(`${BASE}/${id}`, data).then((r) => r.data)
  },

  recordPayment(id: string, data: RecordPaymentPayload) {
    return apiClient
      .patch<Invoice>(`${BASE}/${id}/pay`, data)
      .then((r) => r.data)
  },

  cancel(id: string) {
    return apiClient
      .patch<Invoice>(`${BASE}/${id}/cancel`)
      .then((r) => r.data)
  },
}
