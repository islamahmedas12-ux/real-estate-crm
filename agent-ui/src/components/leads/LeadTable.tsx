import { DataTable } from '../ui/DataTable'
import { Badge } from '../ui/Badge'
import { LeadStatusBadge } from './LeadStatusBadge'
import { formatDate } from '../../utils'
import type { Lead, Column } from '../../types'

interface LeadTableProps {
  data: Lead[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (key: string) => void
  onRowClick: (lead: Lead) => void
}

const priorityVariant: Record<string, 'gray' | 'blue' | 'orange' | 'red'> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
}

const columns: Column<Lead>[] = [
  {
    key: 'client',
    header: 'Client',
    render: (_v, row) =>
      row.client
        ? `${row.client.firstName} ${row.client.lastName}`
        : '-',
  },
  {
    key: 'property',
    header: 'Property',
    render: (_v, row) => row.property?.title ?? '-',
  },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => <LeadStatusBadge status={row.status} />,
  },
  {
    key: 'priority',
    header: 'Priority',
    render: (_v, row) => (
      <Badge variant={priorityVariant[row.priority] ?? 'gray'}>{row.priority}</Badge>
    ),
  },
  {
    key: 'source',
    header: 'Source',
    render: (_v, row) => row.source.replace(/_/g, ' '),
  },
  {
    key: 'nextFollowUp',
    header: 'Follow-up',
    sortable: true,
    render: (_v, row) => (row.nextFollowUp ? formatDate(row.nextFollowUp) : '-'),
  },
  {
    key: 'createdAt',
    header: 'Created',
    sortable: true,
    render: (_v, row) => formatDate(row.createdAt),
  },
]

export function LeadTable({
  data,
  loading,
  page,
  totalPages,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
}: LeadTableProps) {
  return (
    <DataTable<Lead>
      columns={columns}
      data={data}
      loading={loading}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      onRowClick={onRowClick}
      rowKey={(row) => row.id}
      emptyTitle="No leads found"
      emptyDescription="Try adjusting your filters or add a new lead."
    />
  )
}
