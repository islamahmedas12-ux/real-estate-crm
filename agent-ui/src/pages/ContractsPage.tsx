import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Eye, Calendar, DollarSign } from 'lucide-react'
import { contractsApi } from '../api/contracts'
import { Badge } from '../components/ui/Badge'
import { DataTable } from '../components/ui/DataTable'
import { Select } from '../components/ui/Select'
import { StatsCard } from '../components/ui/StatsCard'
import { formatCurrency, formatDate } from '../utils'
import type { Column, Contract, ContractStatus, ContractType } from '../types'
import ContractDetailPage from './ContractDetailPage'

// ─── helpers ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<ContractStatus, 'gray' | 'green' | 'blue' | 'red' | 'yellow'> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  COMPLETED: 'blue',
  CANCELLED: 'red',
  EXPIRED: 'yellow',
}

const TYPE_BADGE: Record<ContractType, 'indigo' | 'purple' | 'sky'> = {
  SALE: 'indigo',
  RENT: 'purple',
  LEASE: 'sky',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'SALE', label: 'Sale' },
  { value: 'RENT', label: 'Rent' },
  { value: 'LEASE', label: 'Lease' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'startDate', label: 'Start Date' },
  { value: 'totalAmount', label: 'Total Amount' },
]

// ─── columns ──────────────────────────────────────────────────────

const columns: Column<Contract>[] = [
  {
    key: 'type',
    header: 'Type',
    render: (_v, row) => (
      <Badge variant={TYPE_BADGE[row.type] ?? 'gray'}>
        {row.type}
      </Badge>
    ),
  },
  {
    key: 'property',
    header: 'Property',
    render: (_v, row) => (
      <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px] block">
        {row.property?.title ?? '-'}
      </span>
    ),
  },
  {
    key: 'client',
    header: 'Client',
    render: (_v, row) =>
      row.client ? `${row.client.firstName} ${row.client.lastName}` : '-',
  },
  {
    key: 'totalAmount',
    header: 'Amount',
    sortable: true,
    render: (_v, row) => (
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {formatCurrency(row.totalAmount)}
      </span>
    ),
  },
  {
    key: 'startDate',
    header: 'Start',
    sortable: true,
    render: (_v, row) => formatDate(row.startDate),
  },
  {
    key: 'endDate',
    header: 'End',
    render: (_v, row) => (row.endDate ? formatDate(row.endDate) : '-'),
  },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => (
      <Badge variant={STATUS_BADGE[row.status] ?? 'gray'}>
        {row.status}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: '',
    width: '48px',
    render: () => (
      <Eye size={16} className="text-gray-400 hover:text-indigo-500 transition-colors" />
    ),
  },
]

// ─── page ─────────────────────────────────────────────────────────

export default function ContractsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', page, statusFilter, typeFilter, sortBy, sortOrder],
    queryFn: () =>
      contractsApi.list({
        page,
        pageSize: 10,
        status: (statusFilter || undefined) as ContractStatus | undefined,
        type: (typeFilter || undefined) as ContractType | undefined,
        sortBy: sortBy as 'createdAt' | 'startDate' | 'totalAmount',
        sortOrder,
      }),
  })

  const { data: stats } = useQuery({
    queryKey: ['contracts', 'stats'],
    queryFn: () => contractsApi.getStats(),
  })

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  // ── detail view ──
  if (selectedId) {
    return (
      <ContractDetailPage
        contractId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contracts</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review your active contracts linked to your clients and properties.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Contracts"
            value={stats.total}
            icon={FileText}
          />
          <StatsCard
            title="Active"
            value={stats.byStatus?.ACTIVE ?? 0}
            icon={Calendar}
          />
          <StatsCard
            title="Completed"
            value={stats.byStatus?.COMPLETED ?? 0}
            icon={Eye}
          />
          <StatsCard
            title="Total Value"
            value={formatCurrency(stats.totalValue ?? 0)}
            icon={DollarSign}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="w-40">
          <Select
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="w-44">
          <Select
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable<Contract>
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(row) => setSelectedId(row.id as string)}
        rowKey={(row) => row.id as string}
        emptyTitle="No contracts found"
        emptyDescription="Contracts assigned to you will appear here."
      />
    </div>
  )
}
