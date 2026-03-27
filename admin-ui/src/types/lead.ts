export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type LeadActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'VIEWING' | 'FOLLOW_UP' | 'STATUS_CHANGE'

export interface Lead {
  id: string
  clientId: string
  client?: { id: string; firstName: string; lastName: string; phone: string; email?: string | null }
  propertyId?: string | null
  property?: { id: string; title: string } | null
  status: LeadStatus
  priority: LeadPriority
  source?: string | null
  budget?: number | null
  notes?: string | null
  assignedAgentId?: string | null
  assignedAgent?: { id: string; name: string } | null
  nextFollowUp?: string | null
  createdAt: string
  updatedAt: string
}

export interface LeadDetail extends Lead {
  activities: LeadActivity[]
}

export interface LeadActivity {
  id: string
  leadId: string
  type: LeadActivityType
  description: string
  performedBy?: string | null
  performedByUser?: { id: string; name: string } | null
  createdAt: string
}

export interface CreateLeadPayload {
  clientId: string
  propertyId?: string
  status?: LeadStatus
  priority?: LeadPriority
  source?: string
  budget?: number
  notes?: string
  assignedAgentId?: string
  nextFollowUp?: string
}

export type UpdateLeadPayload = Partial<CreateLeadPayload>

export interface LeadFilter {
  page?: number
  pageSize?: number
  search?: string
  status?: LeadStatus
  priority?: LeadPriority
  assignedAgentId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'createdAt' | 'priority' | 'nextFollowUp'
  sortOrder?: 'asc' | 'desc'
}

export interface PipelineData {
  [status: string]: Lead[]
}

export interface LeadStats {
  total: number
  byStatus: Record<LeadStatus, number>
  byPriority: Record<LeadPriority, number>
  conversionRate: number
}

export interface ChangeStatusPayload {
  status: LeadStatus
  notes?: string
}

export interface CreateActivityPayload {
  type: LeadActivityType
  description: string
}
