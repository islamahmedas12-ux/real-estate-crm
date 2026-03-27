// ─── Report Types ─────────────────────────────────────────────────────────

export interface RevenueReportParams {
  range?: string
  from?: string
  to?: string
  groupBy?: 'day' | 'week' | 'month'
  type?: string
  agentId?: string
}

export interface RevenueReportItem {
  period: string
  revenue: number
  contracts: number
  avgDealSize: number
}

export interface RevenueReportResponse {
  data: RevenueReportItem[]
  total: number
  period: { start: string; end: string }
}

export interface LeadConversionParams {
  range?: string
  from?: string
  to?: string
  agentId?: string
  source?: string
}

export interface LeadConversionItem {
  source: string
  total: number
  converted: number
  conversionRate: number
}

export interface LeadConversionResponse {
  bySource: LeadConversionItem[]
  overall: {
    total: number
    converted: number
    conversionRate: number
  }
  period: { start: string; end: string }
}

export interface PropertyReportItem {
  type: string
  total: number
  available: number
  sold: number
  rented: number
  avgPrice: number
}

export interface PropertyReportResponse {
  byType: PropertyReportItem[]
  totals: {
    total: number
    available: number
    sold: number
    rented: number
  }
}

// ─── Agent Types ──────────────────────────────────────────────────────────

export interface Agent {
  id: string
  authmeId: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  _count?: {
    assignedProperties: number
    assignedClients: number
    assignedLeads: number
  }
}

export interface AgentDetail extends Agent {
  assignedProperties: {
    id: string
    title: string
    status: string
    price: number
    type: string
  }[]
  assignedClients: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }[]
  assignedLeads: {
    id: string
    title: string
    status: string
    priority: string
    source: string | null
    createdAt: string
  }[]
  performance: {
    totalLeads: number
    leadsWon: number
    revenue: number
    conversionRate: number
  }
}

// ─── Settings Types ───────────────────────────────────────────────────────

export interface CompanySettings {
  name: string
  address: string
  phone: string
  email: string
  website: string
  logo?: string
}

export interface ConfigItem {
  id: string
  label: string
  value: string
  isActive: boolean
}
