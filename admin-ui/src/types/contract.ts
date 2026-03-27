export type ContractType = 'SALE' | 'RENT' | 'LEASE'
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'INSTALLMENT'

export interface Contract {
  id: string
  type: ContractType
  status: ContractStatus
  propertyId: string
  property?: { id: string; title: string; address?: string } | null
  clientId: string
  client?: { id: string; firstName: string; lastName: string; phone: string; email?: string | null } | null
  agentId?: string | null
  agent?: { id: string; name: string } | null
  startDate: string
  endDate?: string | null
  totalAmount: number
  paymentTerms?: Record<string, unknown> | null
  documentUrl?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  _count?: { invoices?: number }
}

export interface ContractDetail extends Contract {
  invoices: {
    id: string
    amount: number
    dueDate: string
    status: string
    paidDate?: string | null
    paymentMethod?: string | null
  }[]
}

export interface CreateContractPayload {
  type: ContractType
  propertyId: string
  clientId: string
  agentId?: string
  startDate: string
  endDate?: string
  totalAmount: number
  paymentTerms?: Record<string, unknown>
  documentUrl?: string
  notes?: string
}

export type UpdateContractPayload = Partial<CreateContractPayload>

export interface ContractFilter {
  page?: number
  pageSize?: number
  type?: ContractType
  status?: ContractStatus
  clientId?: string
  propertyId?: string
  agentId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'createdAt' | 'startDate' | 'endDate' | 'totalAmount'
  sortOrder?: 'asc' | 'desc'
}

export interface ChangeContractStatusPayload {
  status: ContractStatus
}

export interface GenerateInvoicesPayload {
  paymentMethod?: PaymentMethod
}

export interface ContractStats {
  total: number
  byStatus: Record<ContractStatus, number>
  byType: Record<ContractType, number>
  totalValue: number
}
