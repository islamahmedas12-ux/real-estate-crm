import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck, Plus, LayoutGrid } from 'lucide-react'
import { Button, DataTable, SearchBar, Select, StatsCard } from '../../components/ui'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useLeadsList, useLeadStats, useDeleteLead } from '../../hooks/useLeads'
import { formatDate, formatCurrency } from '../../utils'
import toast from 'react-hot-toast'
import type { LeadStatus, LeadPriority, LeadFilter } from '../../types/lead'
import type { Column } from '../../types'

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL', label: 'Proposal' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
]

const LEAD_PRIORITIES: { value: LeadPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

const statusBadge: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  CONTACTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  QUALIFIED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PROPOSAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  NEGOTIATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  WON: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const priorityBadge: Record<string, string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-blue-600 dark:text-blue-400',
  HIGH: 'text-amber-600 dark:text-amber-400',
  URGENT: 'text-red-600 dark:text-red-400',
}

export default function LeadsListPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<LeadFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useLeadsList({ ...filter, search: search || undefined })
  const { data: stats } = useLeadStats()
  const deleteMutation = useDeleteLead()

  const handleSearch = useCallback((q: string) => {
    setSearch(q)
    setFilter((f) => ({ ...f, page: 1 }))
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Lead deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete lead')
    }
  }

  const columns: Column[] = [
    {
      key: 'client',
      header: 'Client',
      render: (_v, row) => {
        const c = row.client as { firstName?: string; lastName?: string } | undefined
        return (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {c ? `${c.firstName} ${c.lastName}` : 'N/A'}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (v) => (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[String(v)] ?? ''}`}>
          {String(v)}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (v) => (
        <span className={`text-xs font-semibold ${priorityBadge[String(v)] ?? ''}`}>
          {String(v)}
        </span>
      ),
    },
    {
      key: 'property',
      header: 'Property',
      render: (_v, row) => {
        const p = row.property as { title?: string } | undefined
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {p?.title ?? '--'}
          </span>
        )
      },
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (v) => (
        <span className="text-sm">{v ? formatCurrency(Number(v)) : '--'}</span>
      ),
    },
    {
      key: 'nextFollowUp',
      header: 'Follow-up',
      sortable: true,
      render: (v) => (
        <span className="text-xs text-gray-500">
          {v ? formatDate(String(v)) : '--'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (v) => <span className="text-xs text-gray-500">{formatDate(String(v))}</span>,
    },
    {
      key: 'id',
      header: '',
      width: '80px',
      render: (_v, row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/leads/${String(row.id)}/edit`)}
            className="rounded px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteId(String(row.id))}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Del
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header — hidden when embedded in LeadsPage */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck size={24} className="text-indigo-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<LayoutGrid size={16} />}
              onClick={() => navigate('/leads/kanban')}
            >
              Kanban
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/leads/new')}>
              Add Lead
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Leads" value={stats.total} icon={UserCheck} color="indigo" />
          <StatsCard title="New" value={stats.byStatus?.NEW ?? 0} icon={UserCheck} color="sky" />
          <StatsCard title="Won" value={stats.byStatus?.WON ?? 0} icon={UserCheck} color="green" />
          <StatsCard
            title="Conversion Rate"
            value={`${(stats.conversionRate ?? 0).toFixed(1)}%`}
            icon={UserCheck}
            color="purple"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar onSearch={handleSearch} placeholder="Search leads..." className="w-64" />
        <Select
          options={[{ value: '', label: 'All Statuses' }, ...LEAD_STATUSES]}
          value={filter.status ?? ''}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              status: (e.target.value || undefined) as LeadStatus | undefined,
              page: 1,
            }))
          }
          className="w-40"
        />
        <Select
          options={[{ value: '', label: 'All Priorities' }, ...LEAD_PRIORITIES]}
          value={filter.priority ?? ''}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              priority: (e.target.value || undefined) as LeadPriority | undefined,
              page: 1,
            }))
          }
          className="w-40"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
        loading={isLoading}
        page={filter.page}
        pageSize={filter.pageSize}
        total={data?.total}
        onPageChange={(p) => setFilter((f) => ({ ...f, page: p }))}
        onPageSizeChange={(ps) => setFilter((f) => ({ ...f, pageSize: ps, page: 1 }))}
        onRowClick={(row) => navigate(`/leads/${String(row.id)}`)}
        emptyMessage="No leads found."
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Lead"
        message="Are you sure? The lead will be marked as LOST."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
