import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { Button, DataTable, Select, StatsCard } from '../../components/ui'
import { useInvoicesList, useInvoiceStats, useOverdueInvoices, useUpcomingInvoices } from '../../hooks/useInvoices'
import { formatDate, formatCurrency } from '../../utils'
import type { InvoiceStatus, InvoiceFilter, Invoice } from '../../types/invoice'
import type { Column } from '../../types'

const INVOICE_STATUSES: { value: InvoiceStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
]

const statusBadge: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  REFUNDED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export default function InvoicesListPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<InvoiceFilter>({
    page: 1,
    pageSize: 10,
    sortBy: 'dueDate',
    sortOrder: 'asc',
  })
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const effectiveFilter: InvoiceFilter = {
    ...filter,
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }

  const [showOverdue, setShowOverdue] = useState(false)
  const [showUpcoming, setShowUpcoming] = useState(false)

  const { data, isLoading } = useInvoicesList(effectiveFilter)
  const { data: stats } = useInvoiceStats()
  const { data: overdueInvoices } = useOverdueInvoices()
  const { data: upcomingInvoices } = useUpcomingInvoices(14)

  const handleDateFilter = useCallback(() => {
    setFilter((f) => ({ ...f, page: 1 }))
  }, [])

  const columns: Column[] = [
    {
      key: 'contract',
      header: 'Contract / Property',
      render: (_v, row) => {
        const contract = row.contract as { type?: string; property?: { title?: string }; client?: { firstName?: string; lastName?: string } } | null
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {contract?.property?.title ?? 'N/A'}
            </span>
            <span className="text-xs text-gray-500">
              {contract?.client
                ? `${contract.client.firstName} ${contract.client.lastName}`
                : 'N/A'}
              {contract?.type && ` - ${contract.type}`}
            </span>
          </div>
        )
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (v) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(Number(v))}
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
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (v) => {
        const date = new Date(String(v))
        const isOverdue = date < new Date()
        return (
          <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            {formatDate(String(v))}
          </span>
        )
      },
    },
    {
      key: 'paidDate',
      header: 'Paid Date',
      render: (v) => (
        <span className="text-gray-500 text-xs">
          {v ? formatDate(String(v)) : '-'}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (v) => (
        <span className="text-gray-600 dark:text-gray-400 text-xs">
          {v ? String(v).replace('_', ' ') : '-'}
        </span>
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
          <Receipt size={24} className="text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Collected"
            value={formatCurrency(stats.totalCollected ?? 0)}
            icon={DollarSign}
            color="green"
          />
          <StatsCard
            title="Total Due"
            value={formatCurrency(stats.totalDue ?? 0)}
            icon={Clock}
            color="amber"
          />
          <StatsCard
            title="Overdue"
            value={stats.overdueCount ?? 0}
            icon={AlertTriangle}
            color="red"
          />
          <StatsCard
            title="Paid"
            value={stats.paidCount ?? 0}
            icon={CheckCircle}
            color="green"
          />
        </div>
      )}

      {/* Overdue Invoices Alert */}
      {overdueInvoices && overdueInvoices.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">
                Overdue Invoices ({overdueInvoices.length})
              </h3>
              <span className="text-xs text-red-600 dark:text-red-400">
                {formatCurrency(overdueInvoices.reduce((s: number, i: Invoice) => s + i.amount, 0))} total overdue
              </span>
            </div>
            <button
              onClick={() => setShowOverdue(!showOverdue)}
              className="text-xs text-red-700 dark:text-red-400 hover:underline font-medium"
            >
              {showOverdue ? 'Hide' : 'Show All'}
            </button>
          </div>
          {showOverdue && (
            <div className="mt-3 space-y-2">
              {overdueInvoices.map((invoice: Invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-800/30 bg-white dark:bg-gray-800 p-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {invoice.contract?.property?.title ?? 'N/A'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {invoice.contract?.client
                        ? `${invoice.contract.client.firstName} ${invoice.contract.client.lastName}`
                        : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(invoice.amount)}
                    </span>
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                      Due {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Invoices */}
      {upcomingInvoices && upcomingInvoices.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
                Upcoming ({upcomingInvoices.length})
              </h3>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Due within 14 days
              </span>
            </div>
            <button
              onClick={() => setShowUpcoming(!showUpcoming)}
              className="text-xs text-blue-700 dark:text-blue-400 hover:underline font-medium"
            >
              {showUpcoming ? 'Hide' : 'Show'}
            </button>
          </div>
          {showUpcoming && (
            <div className="mt-3 space-y-2">
              {upcomingInvoices.map((invoice: Invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="flex items-center justify-between rounded-lg border border-blue-200 dark:border-blue-800/30 bg-white dark:bg-gray-800 p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {invoice.contract?.property?.title ?? 'N/A'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {invoice.contract?.client
                        ? `${invoice.contract.client.firstName} ${invoice.contract.client.lastName}`
                        : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(invoice.amount)}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Due {formatDate(invoice.dueDate)}
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
          options={[{ value: '', label: 'All Statuses' }, ...INVOICE_STATUSES]}
          value={filter.status ?? ''}
          onChange={(e) =>
            setFilter((f) => ({
              ...f,
              status: (e.target.value || undefined) as InvoiceStatus | undefined,
              page: 1,
            }))
          }
          className="w-40"
        />
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Due From</label>
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
            <label className="text-xs text-gray-500 mb-1">Due To</label>
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
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setFilter((f) => ({
              ...f,
              overdue: f.overdue === 'true' ? undefined : 'true',
              page: 1,
            }))
          }
          className={filter.overdue === 'true' ? 'ring-2 ring-red-500' : ''}
        >
          <AlertTriangle size={14} className="mr-1" />
          Overdue Only
        </Button>
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
        onRowClick={(row) => navigate(`/invoices/${String(row.id)}`)}
        emptyMessage="No invoices found."
      />
    </div>
  )
}
