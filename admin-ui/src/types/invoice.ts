import type { PaymentMethod } from './contract'

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'

export interface Invoice {
  id: string
  contractId: string
  contract?: {
    id: string
    type: string
    property?: { id: string; title: string } | null
    client?: { id: string; firstName: string; lastName: string } | null
  } | null
  amount: number
  dueDate: string
  status: InvoiceStatus
  paidDate?: string | null
  paymentMethod?: PaymentMethod | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface InvoiceDetail extends Invoice {
  contract: {
    id: string
    type: string
    status: string
    totalAmount: number
    startDate: string
    endDate?: string | null
    property?: { id: string; title: string; address?: string } | null
    client?: { id: string; firstName: string; lastName: string; phone: string; email?: string | null } | null
    agent?: { id: string; name: string } | null
  }
}

export interface CreateInvoicePayload {
  contractId: string
  amount: number
  dueDate: string
  notes?: string
}

export interface UpdateInvoicePayload {
  amount?: number
  dueDate?: string
  notes?: string
}

export interface InvoiceFilter {
  page?: number
  pageSize?: number
  status?: InvoiceStatus
  contractId?: string
  dateFrom?: string
  dateTo?: string
  overdue?: string
  sortBy?: 'createdAt' | 'dueDate' | 'amount'
  sortOrder?: 'asc' | 'desc'
}

export interface RecordPaymentPayload {
  paidDate: string
  paymentMethod: PaymentMethod
  notes?: string
}

export interface InvoiceStats {
  totalDue: number
  totalCollected: number
  totalOverdue: number
  pendingCount: number
  overdueCount: number
  paidCount: number
}
