import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, AlertTriangle, DollarSign, CheckCircle, Clock } from 'lucide-react'
import { Button, DataTable, Select, StatsCard } from '../../components/ui'
import { useContractsList, useContractStats, useExpiringContracts } from '../../hooks/useContracts'
import { formatDate, formatCurrency } from '../../utils'
import type { ContractType, ContractStatus, ContractFilter, Contract } from '../../types/contract'
import type { Column } from '../../types'

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: 'SALE', label: 'Sale' },
  { value: 'RENT', label: 'Rent' },
  { value: 'LEASE', label: 'Lease' },
]

const CONTRACT_STATUSES: { value: ContractStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' },
]

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

const typeBadge: Record<string, string> = {
  SALE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  RENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  LEASE: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

export default function ContractsListPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<ContractFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showExpiring, setShowExpiring] = useState(false)

  const effectiveFilter: ContractFilter = {
    ...filter,
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }

  const { data, isLoading } = useContractsList(effectiveFilter)
  const { data: stats } = useContractStats()
  const { data: expiringContracts } = useExpiringContracts(30)

  const handleDateFilter = useCallback(() => {
    setFilter((f) => ({ ...f, page: 1 }))
  }, [])

  const columns: Column[] = [
    {
      key: 'property',
      header: 'Property',
      render: (_v, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {(row.property as { title?: string })?.title ?? 'N/A'}
          </span>
          <span className="text-xs text-gray-500">
            {(row.client as { firstName?: string; lastName?: string })
              ? `${(row.client as { firstName: string }).firstName} ${(row.client as { lastName: string }).lastName}`
              : 'N/A'}
          </span>
        </div>
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
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      render: (v) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(Number(v))}
        </span>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      render: (v) => <span className="text-gray-500 text-xs">{formatDate(String(v))}</span>,
    },
    {
      key: 'endDate',
      header: 'End Date',
      render: (v) => (
        <span className="text-gray-500 text-xs">{v ? formatDate(String(v)) : '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (v) => <span className="text-gray-500 text-xs">{formatDate(String(v))}</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contracts</h1>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/contracts/new')}>
          New Contract
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Contracts" value={stats.total} icon={FileText} color="indigo" />
          <StatsCard title="Active" value={stats.byStatus?.ACTIVE ?? 0} icon={CheckCircle} color="green" />
          <StatsCard title="Draft" value={stats.byStatus?.DRAFT ?? 0} icon={AlertTriangle} color="amber" />
          <StatsCard
            title="Total Value"
            value={formatCurrency(stats.totalValue ?? 0)}
            icon={DollarSign}
            color="sky"
          />
        </div>
      )}

      {/* Expiring Contracts Alert */}
      {expiringContracts && expiringContracts.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                Expiring Soon ({expiringContracts.length})
              </h3>
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Contracts expiring within 30 days
              </span>
            </div>
            <button
              onClick={() => setShowExpiring(!showExpiring)}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
            >
              {showExpiring ? 'Hide' : 'Show All'}
            </button>
          </div>
          {showExpiring && (
            <div className="mt-3 space-y-2">
              {expiringContracts.map((contract: Contract) => (
                <div
                  key={contract.id}
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                  className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-800/30 bg-white dark:bg-gray-800 p-3 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge[contract.type] ?? ''}`}>
                      {contract.type}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {contract.property?.title ?? 'N/A'}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {contract.client
                          ? `${contract.client.firstName} ${contract.client.lastName}`
                          : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(contract.totalAmount)}
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Ends {contract.endDate ? formatDate(contract.endDate) : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Select
          options={[{ value: '', label: 'All Types' }, ...CONTRACT_TYPES]}
          value={filter.type ?? ''}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              type: (e.target.value || undefined) as ContractType | undefined,
              page: 1,
            }))
          }
          className="w-36"
        />
        <Select
          options={[{ value: '', label: 'All Statuses' }, ...CONTRACT_STATUSES]}
          value={filter.status ?? ''}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              status: (e.target.value || undefined) as ContractStatus | undefined,
              page: 1,
            }))
          }
          className="w-40"
        />
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                handleDateFilter()
              }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                handleDateFilter()
              }}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                handleDateFilter()
              }}
              className="text-xs text-red-500 hover:text-red-700 pb-2"
            >
              Clear
            </button>
          )}
        </div>
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
        onRowClick={(row) => navigate(`/contracts/${String(row.id)}`)}
        emptyMessage="No contracts found."
      />
    </div>
  )
}
