import { Badge } from '../ui/Badge'
import type { LeadStatus } from '../../types'

const statusConfig: Record<LeadStatus, { label: string; variant: 'gray' | 'blue' | 'indigo' | 'purple' | 'orange' | 'green' | 'red' }> = {
  NEW: { label: 'New', variant: 'blue' },
  CONTACTED: { label: 'Contacted', variant: 'indigo' },
  QUALIFIED: { label: 'Qualified', variant: 'purple' },
  PROPOSAL: { label: 'Proposal', variant: 'orange' },
  NEGOTIATION: { label: 'Negotiation', variant: 'orange' },
  WON: { label: 'Won', variant: 'green' },
  LOST: { label: 'Lost', variant: 'red' },
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
