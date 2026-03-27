import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { Button, Input, Select, Textarea } from '../ui'
import { useRecordPayment } from '../../hooks/useInvoices'
import { cn } from '../../utils'
import toast from 'react-hot-toast'
import type { PaymentMethod } from '../../types/contract'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'INSTALLMENT', label: 'Installment' },
]

interface RecordPaymentDialogProps {
  isOpen: boolean
  invoiceId: string
  onClose: () => void
}

export function RecordPaymentDialog({
  isOpen,
  invoiceId,
  onClose,
}: RecordPaymentDialogProps) {
  const recordPaymentMutation = useRecordPayment()
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ paidDate?: string }>({})

  if (!isOpen) return null

  function validate(): boolean {
    const errs: { paidDate?: string } = {}
    if (!paidDate) errs.paidDate = 'Payment date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    try {
      await recordPaymentMutation.mutateAsync({
        id: invoiceId,
        data: {
          paidDate,
          paymentMethod,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      })
      toast.success('Payment recorded successfully')
      setPaidDate(new Date().toISOString().split('T')[0])
      setPaymentMethod('BANK_TRANSFER')
      setNotes('')
      onClose()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String(
              (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
                'Failed to record payment',
            )
          : 'Failed to record payment'
      toast.error(message)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative w-full max-w-md rounded-xl bg-white shadow-xl p-6',
          'dark:bg-gray-800 dark:border dark:border-gray-700',
        )}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="shrink-0 rounded-full bg-green-100 dark:bg-green-900/30 p-2.5">
            <CreditCard size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Record Payment
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Payment Date"
            type="date"
            required
            value={paidDate}
            onChange={(e) => {
              setPaidDate(e.target.value)
              setErrors({})
            }}
            error={errors.paidDate}
          />

          <Select
            label="Payment Method"
            required
            options={PAYMENT_METHODS}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          />

          <Textarea
            label="Notes / Reference (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Bank transfer ref #12345"
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={recordPaymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={recordPaymentMutation.isPending}
              leftIcon={<CreditCard size={16} />}
            >
              Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
