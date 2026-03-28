import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  FileText,
  DollarSign,
  User,
  Home,
  Receipt,
  Zap,
  AlertCircle,
  Upload,
  ExternalLink,
  Download,
} from 'lucide-react'
import { Button, LoadingSpinner, Select } from '../../components/ui'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  useContractDetail,
  useChangeContractStatus,
  useGenerateInvoices,
} from '../../hooks/useContracts'
import { formatDate, formatCurrency } from '../../utils'
import toast from 'react-hot-toast'
import { StatusTimeline } from '../../components/contracts/StatusTimeline'
import { StatusTransitionButtons } from '../../components/contracts/StatusTransitionButtons'
import type { ContractStatus, PaymentMethod } from '../../types/contract'

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

const invoiceStatusBadge: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  REFUNDED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' },
]

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'INSTALLMENT', label: 'Installment' },
]

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: contract, isLoading, isError } = useContractDetail(id!)
  const changeStatusMutation = useChangeContractStatus()
  const generateInvoicesMutation = useGenerateInvoices()

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<ContractStatus>('ACTIVE')
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [generatePaymentMethod, setGeneratePaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')

  if (isLoading) return <LoadingSpinner message="Loading contract..." />
  if (isError || !contract) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-gray-500">Contract not found.</p>
        <Button variant="secondary" onClick={() => navigate('/contracts')}>
          Back to Contracts
        </Button>
      </div>
    )
  }

  async function handleChangeStatus() {
    try {
      await changeStatusMutation.mutateAsync({ id: id!, data: { status: newStatus } })
      toast.success(`Status changed to ${newStatus}`)
      setStatusDialogOpen(false)
    } catch {
      toast.error('Failed to change status')
    }
  }

  async function handleGenerateInvoices() {
    try {
      const invoices = await generateInvoicesMutation.mutateAsync({
        id: id!,
        data: { paymentMethod: generatePaymentMethod },
      })
      toast.success(`${invoices.length} invoice(s) generated`)
      setGenerateDialogOpen(false)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to generate invoices')
          : 'Failed to generate invoices'
      toast.error(message)
    }
  }

  const paidAmount = contract.invoices
    ?.filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0) ?? 0
  const pendingAmount = contract.invoices
    ?.filter((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.amount, 0) ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/contracts')}
            className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {contract.type} Contract
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[contract.status]}`}>
                {contract.status}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Created {formatDate(contract.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contract.documentUrl && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={() => window.open(contract.documentUrl!, '_blank')}
            >
              Download PDF
            </Button>
          )}
          {contract.status === 'ACTIVE' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Zap size={14} />}
              onClick={() => setGenerateDialogOpen(true)}
            >
              Generate Invoices
            </Button>
          )}
          <Button
            leftIcon={<Edit size={16} />}
            onClick={() => navigate(`/contracts/${id}/edit`)}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Status Timeline */}
      <StatusTimeline currentStatus={contract.status} />

      {/* Status Transition Actions */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Status Actions</h3>
        <StatusTransitionButtons
          currentStatus={contract.status}
          onTransition={async (newStatus) => {
            try {
              await changeStatusMutation.mutateAsync({ id: id!, data: { status: newStatus } })
              toast.success(`Status changed to ${newStatus}`)
            } catch {
              toast.error('Failed to change status')
            }
          }}
          loading={changeStatusMutation.isPending}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Details Card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-500" /> Contract Details
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{contract.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Amount</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(contract.totalAmount)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Start Date</dt>
                <dd className="text-gray-700 dark:text-gray-300">{formatDate(contract.startDate)}</dd>
              </div>
              {contract.endDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">End Date</dt>
                  <dd className="text-gray-700 dark:text-gray-300">{formatDate(contract.endDate)}</dd>
                </div>
              )}
              {contract.paymentTerms && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <dt className="text-xs font-medium text-gray-500 mb-1">Payment Terms</dt>
                  <dd className="text-gray-700 dark:text-gray-300 text-xs">
                    {Boolean(contract.paymentTerms.installments) && (
                      <span>{String(contract.paymentTerms.installments)} installments</span>
                    )}
                    {Boolean(contract.paymentTerms.frequency) && (
                      <span> ({String(contract.paymentTerms.frequency)})</span>
                    )}
                  </dd>
                </div>
              )}
              {contract.notes && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <dt className="text-xs font-medium text-gray-500 mb-1">Notes</dt>
                  <dd className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{contract.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Payment Summary */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-green-500" /> Payment Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(contract.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Paid</span>
                <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">Pending</span>
                <span className="font-medium text-amber-600">{formatCurrency(pendingAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${contract.totalAmount > 0 ? Math.min((paidAmount / contract.totalAmount) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Property Card */}
          {contract.property && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Home size={18} className="text-indigo-500" /> Property
              </h2>
              <Link
                to={`/properties/${contract.property.id}`}
                className="block rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100">{contract.property.title}</p>
                {contract.property.address && (
                  <p className="text-xs text-gray-500 mt-0.5">{contract.property.address}</p>
                )}
              </Link>
            </div>
          )}

          {/* Client Card */}
          {contract.client && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <User size={18} className="text-indigo-500" /> Client
              </h2>
              <Link
                to={`/clients/${contract.client.id}`}
                className="block rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {contract.client.firstName} {contract.client.lastName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{contract.client.phone}</p>
                {contract.client.email && (
                  <p className="text-xs text-gray-500">{contract.client.email}</p>
                )}
              </Link>
            </div>
          )}

          {/* Documents */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <FileText size={18} className="text-indigo-500" /> Documents
            </h2>
            {contract.documentUrl ? (
              <div className="space-y-3">
                <a
                  href={contract.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
                >
                  <FileText size={16} className="text-indigo-500 shrink-0" />
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 group-hover:underline break-all flex-1">
                    {contract.documentUrl.split('/').pop() || 'Contract Document'}
                  </span>
                  <ExternalLink size={14} className="text-gray-400 shrink-0" />
                </a>
                <div className="flex items-center gap-3">
                  <a
                    href={contract.documentUrl}
                    download
                    className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    <Download size={12} />
                    Download
                  </a>
                  <button
                    onClick={() => navigate(`/contracts/${id}/edit`)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Upload size={12} />
                    Replace
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Upload size={24} className="text-gray-300 dark:text-gray-600" />
                <p className="text-xs text-gray-400">No document attached</p>
                <button
                  onClick={() => navigate(`/contracts/${id}/edit`)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Upload document
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Receipt size={18} className="text-indigo-500" /> Invoices ({contract.invoices?.length ?? 0})
              </h2>
            </div>
            {contract.invoices && contract.invoices.length > 0 ? (
              <div className="space-y-2">
                {contract.invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${invoiceStatusBadge[invoice.status] ?? ''}`}>
                        {invoice.status}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Due {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(invoice.amount)}
                      </span>
                      {invoice.paidDate && (
                        <span className="text-xs text-green-600">
                          Paid {formatDate(invoice.paidDate)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertCircle size={32} className="text-gray-300" />
                <p className="text-sm text-gray-400">No invoices yet.</p>
                {contract.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Zap size={14} />}
                    onClick={() => setGenerateDialogOpen(true)}
                  >
                    Generate Invoices
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Status Dialog */}
      <ConfirmDialog
        isOpen={statusDialogOpen}
        title="Change Contract Status"
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select the new status for this contract.
            </p>
            <Select
              options={STATUS_OPTIONS}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ContractStatus)}
            />
          </div>
        }
        confirmLabel="Update Status"
        onConfirm={handleChangeStatus}
        onCancel={() => setStatusDialogOpen(false)}
        loading={changeStatusMutation.isPending}
      />

      {/* Generate Invoices Dialog */}
      <ConfirmDialog
        isOpen={generateDialogOpen}
        title="Generate Invoices"
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Auto-generate invoices based on payment terms. Select the default payment method.
            </p>
            <Select
              label="Payment Method"
              options={PAYMENT_METHODS}
              value={generatePaymentMethod}
              onChange={(e) => setGeneratePaymentMethod(e.target.value as PaymentMethod)}
            />
          </div>
        }
        confirmLabel="Generate"
        onConfirm={handleGenerateInvoices}
        onCancel={() => setGenerateDialogOpen(false)}
        loading={generateInvoicesMutation.isPending}
      />
    </div>
  )
}
