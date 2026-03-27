import { DataTable } from '../ui/DataTable'
import { Badge } from '../ui/Badge'
import { formatDate } from '../../utils'
import type { Client, Column } from '../../types'

interface ClientTableProps {
  data: Client[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (key: string) => void
  onRowClick: (client: Client) => void
}

const typeVariant: Record<string, 'blue' | 'green' | 'purple' | 'orange' | 'indigo'> = {
  BUYER: 'blue',
  SELLER: 'green',
  TENANT: 'purple',
  LANDLORD: 'orange',
  INVESTOR: 'indigo',
}

const columns: Column<Client>[] = [
  {
    key: 'firstName',
    header: 'Name',
    sortable: true,
    render: (_v, row) => (
      <span className="font-medium">{row.firstName} {row.lastName}</span>
    ),
  },
  {
    key: 'email',
    header: 'Email',
    render: (_v, row) => row.email ?? '-',
  },
  {
    key: 'phone',
    header: 'Phone',
  },
  {
    key: 'type',
    header: 'Type',
    render: (_v, row) => (
      <Badge variant={typeVariant[row.type] ?? 'gray'}>{row.type}</Badge>
    ),
  },
  {
    key: 'source',
    header: 'Source',
    render: (_v, row) => row.source.replace(/_/g, ' '),
  },
  {
    key: '_count',
    header: 'Leads',
    render: (_v, row) => row._count?.leads ?? 0,
  },
  {
    key: 'createdAt',
    header: 'Created',
    sortable: true,
    render: (_v, row) => formatDate(row.createdAt),
  },
]

export function ClientTable({
  data,
  loading,
  page,
  totalPages,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
}: ClientTableProps) {
  return (
    <DataTable<Client>
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
      emptyTitle="No clients found"
      emptyDescription="Try adjusting your filters or add a new client."
    />
  )
}
