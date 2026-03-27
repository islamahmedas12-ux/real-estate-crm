// ─── API Response Types ─────────────────────────────────────────────────────

export type DateRangePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom'

export interface DateRangeParams {
  range?: DateRangePreset
  from?: string
  to?: string
}

export interface OverviewResponse {
  totals: {
    properties: number
    clients: number
    leads: number
    contracts: number
    revenue: number
  }
  period: {
    newProperties: number
    newClients: number
    newLeads: number
    start: string
    end: string
  }
}

export interface RevenueTimelinePoint {
  date: string
  amount: number
}

export interface RevenueResponse {
  timeline: RevenueTimelinePoint[]
  total: number
  previousPeriodTotal: number
  changePercent: number | null
  period: { start: string; end: string }
}

export interface LeadPipelineItem {
  status: string
  count: number
}

export interface LeadPriorityItem {
  priority: string
  count: number
}

export interface LeadsResponse {
  pipeline: LeadPipelineItem[]
  byPriority: LeadPriorityItem[]
  newLeadsInPeriod: number
  wonLeadsInPeriod: number
  conversionRate: number
}

export interface PropertyStatusItem {
  status: string
  count: number
}

export interface PropertyTypeItem {
  type: string
  count: number
}

export interface PropertiesResponse {
  byStatus: PropertyStatusItem[]
  byType: PropertyTypeItem[]
  total: number
}

export interface AgentPerformanceItem {
  agentId: string
  leadsWon: number
  totalLeads: number
  revenue: number
}

export interface AgentsResponse {
  agents: AgentPerformanceItem[]
  period: { start: string; end: string }
}

export interface ActivityItem {
  id: string
  type: string
  description: string
  entityType?: string
  entityId?: string
  userId?: string
  createdAt: string
}
