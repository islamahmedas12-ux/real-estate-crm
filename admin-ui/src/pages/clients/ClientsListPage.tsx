import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Mail, Phone, AlertTriangle, Download, Filter, X } from 'lucide-react'
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

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

  const handleExportCsv = useCallback(() => {
    const rows = data?.data ?? []
    if (rows.length === 0) {
      toast.error('No clients to export')
      return
    }
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Source', 'Created']
    const csvRows = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `"${String(r.firstName)} ${String(r.lastName)}"`,
          `"${String(r.email ?? '')}"`,
          `"${String(r.phone)}"`,
          String(r.type),
          String(r.source ?? ''),
          formatDate(String(r.createdAt)),
        ].join(',')
      ),
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} clients`)
  }, [data?.data])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filter.type) count++
    if (filter.source) count++
    if (filter.assignedAgentId) count++
    return count
  }, [filter.type, filter.source, filter.assignedAgentId])

  const clearFilters = useCallback(() => {
    setFilter((f) => ({ ...f, type: undefined, source: undefined, assignedAgentId: undefined, page: 1 }))
    setSearch('')
  }, [])

  // Detect duplicate phones in the current page of results
  const duplicatePhones = useMemo(() => {
    const rows = data?.data ?? []
    const phoneCount: Record<string, number> = {}
    for (const r of rows) {
      const phone = String(r.phone).trim()
      if (phone) phoneCount[phone] = (phoneCount[phone] || 0) + 1
    }
    const dups = new Set<string>()
    for (const [phone, count] of Object.entries(phoneCount)) {
      if (count > 1) dups.add(phone)
    }
    return dups
  }, [data?.data])

  const columns: Column[] = [
    {
      key: 'firstName',
      header: 'Name',
      sortable: true,
      render: (_v, row) => {
        const phone = String(row.phone).trim()
        const isDuplicate = duplicatePhones.has(phone)
        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="font-medium">{String(row.firstName)} {String(row.lastName)}</span>
              {Boolean(row.email) && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Mail size={10} /> {String(row.email)}
                </span>
              )}
            </div>
            {isDuplicate && (
              <span
                className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                title="Duplicate phone number detected in list"
              >
                <AlertTriangle size={10} /> Dup
              </span>
            )}
          </div>
        )
      },
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
      key: '_count',
      header: 'Leads',
      render: (_v, row) => {
        const count = (row._count as Record<string, number> | undefined)
        return (
          <span className="text-gray-500 text-xs">
            {count?.leads ?? 0} leads &middot; {count?.contracts ?? 0} contracts
          </span>
        )
      },
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
          {data?.total != null && (
            <span className="text-sm text-gray-500 dark:text-gray-400">({data.total})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<Download size={16} />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/clients/new')}>
            Add Client
          </Button>
        </div>
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

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by name, email, phone..."
            className="w-72"
          />
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={12} /> Clear filters
            </button>
          )}
          {selectedIds.size > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              {selectedIds.size} selected
            </span>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
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
            <Select
              options={[
                { value: 'createdAt', label: 'Sort: Date Created' },
                { value: 'firstName', label: 'Sort: First Name' },
                { value: 'lastName', label: 'Sort: Last Name' },
              ]}
              value={filter.sortBy ?? 'createdAt'}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  sortBy: e.target.value as ClientFilter['sortBy'],
                }))
              }
              className="w-44"
            />
            <Select
              options={[
                { value: 'desc', label: 'Descending' },
                { value: 'asc', label: 'Ascending' },
              ]}
              value={filter.sortOrder ?? 'desc'}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  sortOrder: e.target.value as 'asc' | 'desc',
                }))
              }
              className="w-36"
            />
          </div>
        )}
      </div>

      {/* Duplicate warning banner */}
      {duplicatePhones.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            <strong>{duplicatePhones.size}</strong> duplicate phone number{duplicatePhones.size > 1 ? 's' : ''} detected on this page.
            Rows are marked with a &quot;Dup&quot; badge.
          </span>
        </div>
      )}

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
        emptyMessage="No clients found. Try adjusting your search or filters."
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
