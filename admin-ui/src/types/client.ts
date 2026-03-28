export type ClientType = 'BUYER' | 'SELLER' | 'TENANT' | 'LANDLORD' | 'INVESTOR'
export type ClientSource = 'REFERRAL' | 'WEBSITE' | 'SOCIAL_MEDIA' | 'WALK_IN' | 'PHONE' | 'OTHER'

export interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone: string
  nationalId?: string | null
  type: ClientType
  source: ClientSource
  notes?: string | null
  assignedAgentId?: string | null
  assignedAgent?: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
  _count?: { leads?: number; contracts?: number }
}

export interface ClientDetail extends Client {
  leads: {
    id: string
    status: string
    priority: string
    source?: string | null
    createdAt: string
    property?: { id: string; title: string } | null
  }[]
  contracts: {
    id: string
    type: string
    status: string
    totalAmount: number
    createdAt: string
    property?: { id: string; title: string } | null
  }[]
}

export interface ClientHistory {
  leads: {
    id: string
    status: string
    priority: string
    createdAt: string
    property?: { id: string; title: string } | null
  }[]
  contracts: {
    id: string
    type: string
    status: string
    totalAmount: number
    createdAt: string
  }[]
}

export interface CreateClientPayload {
  firstName: string
  lastName: string
  email?: string
  phone: string
  nationalId?: string
  type: ClientType
  source?: ClientSource
  notes?: string
}

export type UpdateClientPayload = Partial<CreateClientPayload>

export interface ClientFilter {
  page?: number
  pageSize?: number
  search?: string
  type?: ClientType
  source?: ClientSource
  assignedAgentId?: string
  sortBy?: 'createdAt' | 'firstName' | 'lastName'
  sortOrder?: 'asc' | 'desc'
}

export interface ClientStats {
  total: number
  byType: Record<ClientType, number>
  bySource: Record<ClientSource, number>
  recentCount: number
}

export interface DuplicateMatch {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string | null
  nationalId?: string | null
  matchedOn: ('phone' | 'email' | 'nationalId')[]
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean
  matches: DuplicateMatch[]
}
