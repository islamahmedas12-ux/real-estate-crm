import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Mail, Phone } from 'lucide-react'
import { Button, DataTable, SearchBar, Select, StatsCard } from '../../components/ui'
import { useClientsList, useClientStats, useDeleteClient } from '../../hooks/useClients'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { formatDate } from '../../utils'
import toast from 'react-hot-toast'
import type { ClientType, ClientSource, ClientFilter } from '../../types/client'
import type { Column } from '../../types'

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: 'BUYER', label: 'Buyer' },
  { value: 'SELLER', label: 'Seller' },
  { value: 'TENANT', label: 'Tenant' },
  { value: 'LANDLORD', label: 'Landlord' },
  { value: 'INVESTOR', label: 'Investor' },
]

const CLIENT_SOURCES: { value: ClientSource; label: string }[] = [
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'OTHER', label: 'Other' },
]

const typeBadge: Record<string, string> = {
  BUYER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SELLER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  TENANT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  LANDLORD: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  INVESTOR: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
}

export default function ClientsListPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<ClientFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useClientsList({ ...filter, search: search || undefined })
  const { data: stats } = useClientStats()
  const deleteMutation = useDeleteClient()

  const handleSearch = useCallback((q: string) => {
    setSearch(q)
    setFilter((f) => ({ ...f, page: 1 }))
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Client deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete client')
    }
  }

  const columns: Column[] = [
    {
      key: 'firstName',
      header: 'Name',
      sortable: true,
      render: (_v, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{String(row.firstName)} {String(row.lastName)}</span>
          {Boolean(row.email) && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Mail size={10} /> {String(row.email)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (v) => (
        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <Phone size={12} /> {String(v)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (v) => (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadge[String(v)] ?? ''}`}>
          {String(v)}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (v) => (
        <span className="text-gray-600 dark:text-gray-400 text-xs">
          {String(v ?? '').replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (v) => <span className="text-gray-500 text-xs">{formatDate(String(v))}</span>,
    },
    {
      key: 'id',
      header: '',
      width: '80px',
      render: (_v, row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/clients/${String(row.id)}/edit`)}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/clients/new')}>
          Add Client
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Clients" value={stats.total} icon={Users} color="indigo" />
          <StatsCard title="Buyers" value={stats.byType?.BUYER ?? 0} icon={Users} color="sky" />
          <StatsCard title="Sellers" value={stats.byType?.SELLER ?? 0} icon={Users} color="green" />
          <StatsCard title="Recent (30d)" value={stats.recentCount ?? 0} icon={Users} color="amber" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search clients..."
          className="w-64"
        />
        <Select
          options={[{ value: '', label: 'All Types' }, ...CLIENT_TYPES]}
          value={filter.type ?? ''}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              type: (e.target.value || undefined) as ClientType | undefined,
              page: 1,
            }))
          }
          className="w-40"
        />
        <Select
          options={[{ value: '', label: 'All Sources' }, ...CLIENT_SOURCES]}
          value={filter.source ?? ''}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              source: (e.target.value || undefined) as ClientSource | undefined,
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
        onRowClick={(row) => navigate(`/clients/${String(row.id)}`)}
        emptyMessage="No clients found."
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
