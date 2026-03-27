import { Badge } from '../ui/Badge'
import type { PropertyStatus } from '../../types'

const statusConfig: Record<PropertyStatus, { label: string; variant: 'green' | 'yellow' | 'red' | 'blue' | 'gray' }> = {
  AVAILABLE: { label: 'Available', variant: 'green' },
  RESERVED: { label: 'Reserved', variant: 'yellow' },
  SOLD: { label: 'Sold', variant: 'red' },
  RENTED: { label: 'Rented', variant: 'blue' },
  OFF_MARKET: { label: 'Off Market', variant: 'gray' },
}

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
