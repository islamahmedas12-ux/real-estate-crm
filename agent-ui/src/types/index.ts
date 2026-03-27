import React from 'react'

// Auth
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'agent' | 'manager'
  avatar?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

// Generic API
export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Table
export interface Column<T = Record<string, unknown>> {
  key: string
  header: string
  render?: (value: unknown, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

// ─── Enums ────────────────────────────────────────────────────────

export type PropertyType =
  | 'APARTMENT' | 'VILLA' | 'OFFICE' | 'SHOP' | 'LAND'
  | 'BUILDING' | 'CHALET' | 'STUDIO' | 'DUPLEX' | 'PENTHOUSE'

export type PropertyStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'OFF_MARKET'

export type ClientType = 'BUYER' | 'SELLER' | 'TENANT' | 'LANDLORD' | 'INVESTOR'

export type ClientSource =
  | 'REFERRAL' | 'WEBSITE' | 'SOCIAL_MEDIA' | 'WALK_IN'
  | 'PHONE' | 'ADVERTISEMENT' | 'OTHER'

export type LeadStatus =
  | 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL'
  | 'NEGOTIATION' | 'WON' | 'LOST'

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type LeadActivityType =
  | 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE'
  | 'VIEWING' | 'FOLLOW_UP' | 'STATUS_CHANGE'

// ─── Domain Models ────────────────────────────────────────────────

export interface PropertyImage {
  id: string
  url: string
  caption?: string
  isPrimary: boolean
  order: number
}

export interface Property {
  id: string
  title: string
  description?: string
  type: PropertyType
  status: PropertyStatus
  price: number
  area: number
  bedrooms?: number
  bathrooms?: number
  floor?: number
  address: string
  city: string
  region: string
  latitude?: number
  longitude?: number
  features?: Record<string, unknown>
  assignedAgentId?: string
  images?: PropertyImage[]
  createdAt: string
  updatedAt: string
  _count?: { leads?: number }
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  nationalId?: string
  type: ClientType
  source: ClientSource
  notes?: string
  assignedAgentId?: string
  createdAt: string
  updatedAt: string
  leads?: Lead[]
  _count?: { leads?: number }
}

export interface Lead {
  id: string
  clientId: string
  propertyId?: string
  status: LeadStatus
  priority: LeadPriority
  source: string
  budget?: number
  notes?: string
  assignedAgentId?: string
  nextFollowUp?: string
  createdAt: string
  updatedAt: string
  client?: Client
  property?: Property
}

export interface LeadActivity {
  id: string
  leadId: string
  type: LeadActivityType
  description: string
  performedBy: string
  createdAt: string
}

// ─── Stats ────────────────────────────────────────────────────────

export interface LeadStats {
  total: number
  byStatus: Record<LeadStatus, number>
  byPriority: Record<LeadPriority, number>
}

export interface ClientStats {
  total: number
  byType: Record<ClientType, number>
}

export interface PropertyStats {
  total: number
  byStatus: Record<PropertyStatus, number>
  byType: Record<PropertyType, number>
}

// ─── Payloads ─────────────────────────────────────────────────────

export interface CreateLeadPayload {
  clientId: string
  propertyId?: string
  source?: string
  priority?: LeadPriority
  budget?: number
  notes?: string
  nextFollowUp?: string
}

export type UpdateLeadPayload = Partial<CreateLeadPayload>

export interface CreateClientPayload {
  firstName: string
  lastName: string
  phone: string
  email?: string
  nationalId?: string
  type: ClientType
  source: ClientSource
  notes?: string
}

export type UpdateClientPayload = Partial<CreateClientPayload>

// ─── Contract ────────────────────────────────────────────────────

export type ContractType = 'SALE' | 'RENT' | 'LEASE'
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
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

export interface Invoice {
  id: string
  contractId: string
  amount: number
  dueDate: string
  status: InvoiceStatus
  paidDate?: string | null
  paymentMethod?: PaymentMethod | null
}

export interface ContractDetail extends Contract {
  invoices: Invoice[]
}

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

export interface ContractStats {
  total: number
  byStatus: Record<ContractStatus, number>
  byType: Record<ContractType, number>
  totalValue: number
}

// ─── Activity ────────────────────────────────────────────────────

export type ActivityEntityType = 'PROPERTY' | 'CLIENT' | 'LEAD' | 'CONTRACT' | 'INVOICE'

export interface Activity {
  id: string
  type: string
  description: string
  entityType: ActivityEntityType
  entityId: string
  performedBy: string
  metadata?: Record<string, unknown> | null
  createdAt: string
  user?: { id: string; name: string } | null
}

export interface ActivityFilter {
  page?: number
  pageSize?: number
  type?: string
  entityType?: ActivityEntityType
  entityId?: string
  performedBy?: string
  from?: string
  to?: string
}

export interface CreateActivityPayload {
  type: string
  description: string
  entityType: ActivityEntityType
  entityId: string
  performedBy: string
  metadata?: Record<string, unknown>
}

// Theme
export type Theme = 'light' | 'dark'

// Navigation
export interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children?: NavItem[]
}
