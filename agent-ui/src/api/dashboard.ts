import apiClient from './client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AgentOverview {
  properties: number
  clients: number
  leads: number
  upcomingFollowUps: number
}

export interface PipelineStage {
  status: string
  count: number
}

export interface AgentLeadsPipeline {
  pipeline: PipelineStage[]
  total: number
}

export interface FollowUpClient {
  id: string
  firstName: string
  lastName: string
  phone: string
}

export interface FollowUpProperty {
  id: string
  title: string
}

export interface FollowUpItem {
  id: string
  status: string
  priority: string
  nextFollowUp: string
  client: FollowUpClient
  property: FollowUpProperty | null
}

export interface AgentFollowUps {
  overdue: FollowUpItem[]
  upcoming: FollowUpItem[]
}

export interface PerformancePeriod {
  leads: number
  won: number
  revenue: number
}

export interface AgentPerformance {
  thisMonth: PerformancePeriod
  lastMonth: PerformancePeriod
  change: {
    leads: number | null
    won: number | null
    revenue: number | null
  }
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function fetchAgentOverview(): Promise<AgentOverview> {
  const { data } = await apiClient.get<AgentOverview>('/api/dashboard/agent/overview')
  return data
}

export async function fetchAgentLeadsPipeline(): Promise<AgentLeadsPipeline> {
  const { data } = await apiClient.get<AgentLeadsPipeline>('/api/dashboard/agent/leads')
  return data
}

export async function fetchAgentFollowUps(): Promise<AgentFollowUps> {
  const { data } = await apiClient.get<AgentFollowUps>('/api/dashboard/agent/follow-ups')
  return data
}

export async function fetchAgentPerformance(): Promise<AgentPerformance> {
  const { data } = await apiClient.get<AgentPerformance>('/api/dashboard/agent/performance')
  return data
}
