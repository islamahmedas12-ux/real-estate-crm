import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Receipt,
  FileText,
  DollarSign,
  Calendar,
  User,
  Home,
  CreditCard,
  XCircle,
  Printer,
  Download,
} from 'lucide-react'
import { Button, LoadingSpinner } from '../../components/ui'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useInvoiceDetail, useCancelInvoice } from '../../hooks/useInvoices'
import { RecordPaymentDialog } from '../../components/invoices/RecordPaymentDialog'
import { formatDate, formatCurrency } from '../../utils'
import toast from 'react-hot-toast'

const statusBadge: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  REFUNDED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: invoice, isLoading, isError } = useInvoiceDetail(id!)
  const cancelMutation = useCancelInvoice()

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (isLoading) return <LoadingSpinner message="Loading invoice..." />
  if (isError || !invoice) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-gray-500">Invoice not found.</p>
        <Button variant="secondary" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    )
  }

  const canPay = invoice.status === 'PENDING' || invoice.status === 'OVERDUE'
  const canCancel = invoice.status === 'PENDING' || invoice.status === 'OVERDUE'
  const isOverdue = invoice.status === 'OVERDUE' || (invoice.status === 'PENDING' && new Date(invoice.dueDate) < new Date())

  function handlePrint() {
    window.print()
  }

  function handleExport() {
    if (!invoice) return
    const invoiceData = {
      id: invoice.id,
      amount: invoice.amount,
      status: invoice.status,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      paymentMethod: invoice.paymentMethod,
      notes: invoice.notes,
      contract: invoice.contract ? {
        id: invoice.contract.id,
        type: invoice.contract.type,
        status: invoice.contract.status,
        totalAmount: invoice.contract.totalAmount,
        property: invoice.contract.property?.title,
        client: invoice.contract.client
          ? `${invoice.contract.client.firstName} ${invoice.contract.client.lastName}`
          : null,
      } : null,
    }
    const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoice.id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCancel() {
    try {
      await cancelMutation.mutateAsync(id!)
      toast.success('Invoice cancelled')
      setCancelOpen(false)
    } catch {
      toast.error('Failed to cancel invoice')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Invoice
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[invoice.status]}`}>
                {invoice.status}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Created {formatDate(invoice.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer size={14} />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleExport}
          >
            Export
          </Button>
          {canPay && (
            <Button
              leftIcon={<CreditCard size={16} />}
              onClick={() => setPaymentOpen(true)}
            >
              Record Payment
            </Button>
          )}
          {canCancel && (
            <Button
              variant="secondary"
              leftIcon={<XCircle size={16} />}
              onClick={() => setCancelOpen(true)}
            >
              Cancel Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Overdue Alert */}
      {isOverdue && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-center gap-3">
          <div className="shrink-0 rounded-full bg-red-100 dark:bg-red-900/40 p-2">
            <Calendar size={16} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              This invoice is overdue
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Due date was {formatDate(invoice.dueDate)}. Please record payment or follow up with the client.
            </p>
          </div>
          {canPay && (
            <Button
              size="sm"
              className="ml-auto"
              leftIcon={<CreditCard size={14} />}
              onClick={() => setPaymentOpen(true)}
            >
              Record Payment
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Receipt size={18} className="text-indigo-500" /> Invoice Details
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 flex items-center gap-1">
                  <DollarSign size={14} /> Amount
                </dt>
                <dd className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {formatCurrency(invoice.amount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 flex items-center gap-1">
                  <Calendar size={14} /> Due Date
                </dt>
                <dd className={`font-medium ${
                  (invoice.status === 'PENDING' || invoice.status === 'OVERDUE') && new Date(invoice.dueDate) < new Date()
                    ? 'text-red-500'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {formatDate(invoice.dueDate)}
                </dd>
              </div>
              {invoice.paidDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Paid Date</dt>
                  <dd className="text-green-600 font-medium">{formatDate(invoice.paidDate)}</dd>
                </div>
              )}
              {invoice.paymentMethod && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Payment Method</dt>
                  <dd className="text-gray-700 dark:text-gray-300">
                    {invoice.paymentMethod.replace('_', ' ')}
                  </dd>
                </div>
              )}
              {invoice.notes && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <dt className="text-xs font-medium text-gray-500 mb-1">Notes</dt>
                  <dd className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {invoice.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Contract Info */}
        <div className="lg:col-span-2 space-y-6">
          {invoice.contract && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" /> Contract Info
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to={`/contracts/${invoice.contract.id}`}
                  className="block rounded-lg border border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {invoice.contract.type} Contract
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Status: {invoice.contract.status}</p>
                    <p>Total: {formatCurrency(invoice.contract.totalAmount)}</p>
                    <p>
                      {formatDate(invoice.contract.startDate)}
                      {invoice.contract.endDate && ` - ${formatDate(invoice.contract.endDate)}`}
                    </p>
                  </div>
                </Link>

                {invoice.contract.property && (
                  <Link
                    to={`/properties/${invoice.contract.property.id}`}
                    className="block rounded-lg border border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Home size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Property
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {invoice.contract.property.title}
                    </p>
                    {invoice.contract.property.address && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {invoice.contract.property.address}
                      </p>
                    )}
                  </Link>
                )}

                {invoice.contract.client && (
                  <Link
                    to={`/clients/${invoice.contract.client.id}`}
                    className="block rounded-lg border border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Client
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {invoice.contract.client.firstName} {invoice.contract.client.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {invoice.contract.client.phone}
                    </p>
                    {invoice.contract.client.email && (
                      <p className="text-xs text-gray-500">{invoice.contract.client.email}</p>
                    )}
                  </Link>
                )}

                {invoice.contract.agent && (
                  <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Agent
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {invoice.contract.agent.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        isOpen={paymentOpen}
        invoiceId={id!}
        onClose={() => setPaymentOpen(false)}
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={cancelOpen}
        title="Cancel Invoice"
        message="Are you sure you want to cancel this invoice? This action cannot be undone."
        confirmLabel="Cancel Invoice"
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
        loading={cancelMutation.isPending}
      />
    </div>
  )
}
