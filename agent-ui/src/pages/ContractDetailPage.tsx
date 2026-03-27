import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  FileText,
  Building2,
  Users,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { contractsApi } from '../api/contracts'
import { ActivityLog } from '../components/ActivityLog'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../utils'
import type { ContractStatus, Invoice, InvoiceStatus } from '../types'

// ─── helpers ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<ContractStatus, 'gray' | 'green' | 'blue' | 'red' | 'yellow'> = {
  DRAFT: 'gray',
  ACTIVE: 'green',
  COMPLETED: 'blue',
  CANCELLED: 'red',
  EXPIRED: 'yellow',
}

const INVOICE_BADGE: Record<InvoiceStatus, 'yellow' | 'green' | 'red' | 'gray'> = {
  PENDING: 'yellow',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'gray',
}

const INVOICE_ICON: Record<InvoiceStatus, React.ComponentType<{ size?: number; className?: string }>> = {
  PENDING: Clock,
  PAID: CheckCircle2,
  OVERDUE: AlertCircle,
  CANCELLED: XCircle,
}

// ─── component ────────────────────────────────────────────────────

interface ContractDetailPageProps {
  contractId: string
  onBack: () => void
}

export default function ContractDetailPage({ contractId, onBack }: ContractDetailPageProps) {
  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contracts', contractId],
    queryFn: () => contractsApi.getById(contractId),
    enabled: !!contractId,
  })

  if (isLoading) return <LoadingSpinner message="Loading contract..." />

  if (error || !contract) {
    return (
      <div className="flex flex-col items-center py-16 gap-4">
        <p className="text-sm text-red-500">Failed to load contract details.</p>
        <Button variant="secondary" size="sm" onClick={onBack}>
          Back to Contracts
        </Button>
      </div>
    )
  }

  const invoices: Invoice[] = contract.invoices ?? []
  const paidTotal = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0)
  const pendingTotal = invoices
    .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Contract Details
            </h1>
            <Badge variant={STATUS_BADGE[contract.status]}>{contract.status}</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {contract.type} contract &middot; Created {formatDate(contract.createdAt)}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Property */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Building2 size={16} />
            <span className="text-xs font-medium uppercase tracking-wide">Property</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {contract.property?.title ?? 'N/A'}
          </p>
          {contract.property?.address && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {contract.property.address}
            </p>
          )}
        </div>

        {/* Client */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <Users size={16} />
            <span className="text-xs font-medium uppercase tracking-wide">Client</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {contract.client
              ? `${contract.client.firstName} ${contract.client.lastName}`
              : 'N/A'}
          </p>
          {contract.client?.phone && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {contract.client.phone}
            </p>
          )}
        </div>

        {/* Financial */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
            <DollarSign size={16} />
            <span className="text-xs font-medium uppercase tracking-wide">Financials</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(contract.totalAmount)}
          </p>
          <div className="flex gap-3 mt-1">
            <span className="text-xs text-green-600 dark:text-green-400">
              Paid: {formatCurrency(paidTotal)}
            </span>
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              Pending: {formatCurrency(pendingTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Date range */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Start:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatDate(contract.startDate)}
          </span>
        </div>
        {contract.endDate && (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">End:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatDate(contract.endDate)}
            </span>
          </div>
        )}
        {contract.notes && (
          <p className="basis-full text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
            {contract.notes}
          </p>
        )}
      </div>

      {/* Invoice schedule */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <FileText size={16} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Invoice Schedule
          </h2>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No invoices generated yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((inv) => {
              const InvIcon = INVOICE_ICON[inv.status as InvoiceStatus] ?? Clock
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <InvIcon size={18} className="text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(inv.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Due {formatDate(inv.dueDate)}
                      {inv.paidDate && ` — Paid ${formatDate(inv.paidDate)}`}
                    </p>
                  </div>
                  <Badge variant={INVOICE_BADGE[inv.status as InvoiceStatus] ?? 'gray'}>
                    {inv.status}
                  </Badge>
                  {inv.paymentMethod && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                      {inv.paymentMethod.replace('_', ' ')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Activity timeline */}
      <ActivityLog entityType="CONTRACT" entityId={contractId} />
    </div>
  )
}
