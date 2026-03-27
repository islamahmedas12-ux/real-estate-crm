import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button, Input, Select, Textarea, LoadingSpinner } from '../../components/ui'
import {
  useContractDetail,
  useCreateContract,
  useUpdateContract,
} from '../../hooks/useContracts'
import { useClientsList } from '../../hooks/useClients'
import toast from 'react-hot-toast'
import type { ContractType, CreateContractPayload } from '../../types/contract'

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: 'SALE', label: 'Sale' },
  { value: 'RENT', label: 'Rent' },
  { value: 'LEASE', label: 'Lease' },
]

interface FormState {
  type: ContractType
  propertyId: string
  clientId: string
  agentId: string
  startDate: string
  endDate: string
  totalAmount: string
  installments: string
  frequency: string
  documentUrl: string
  notes: string
}

const INITIAL: FormState = {
  type: 'SALE',
  propertyId: '',
  clientId: '',
  agentId: '',
  startDate: '',
  endDate: '',
  totalAmount: '',
  installments: '',
  frequency: 'monthly',
  documentUrl: '',
  notes: '',
}

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'one-time', label: 'One-Time' },
]

export default function ContractFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const { data: existing, isLoading: loadingExisting } = useContractDetail(id ?? '')
  const createMutation = useCreateContract()
  const updateMutation = useUpdateContract()

  // Fetch clients for the dropdown
  const { data: clientsData } = useClientsList({ page: 1, pageSize: 200 })
  const clientOptions = (clientsData?.data ?? []).map((c) => ({
    value: c.id,
    label: `${c.firstName} ${c.lastName}`,
  }))

  useEffect(() => {
    if (existing && isEdit) {
      setForm({
        type: existing.type,
        propertyId: existing.propertyId,
        clientId: existing.clientId,
        agentId: existing.agentId ?? '',
        startDate: existing.startDate ? existing.startDate.split('T')[0] : '',
        endDate: existing.endDate ? existing.endDate.split('T')[0] : '',
        totalAmount: String(existing.totalAmount),
        installments: existing.paymentTerms?.installments ? String(existing.paymentTerms.installments) : '',
        frequency: existing.paymentTerms?.frequency ? String(existing.paymentTerms.frequency) : 'monthly',
        documentUrl: existing.documentUrl ?? '',
        notes: existing.notes ?? '',
      })
    }
  }, [existing, isEdit])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.propertyId.trim()) errs.propertyId = 'Property ID is required'
    if (!form.clientId.trim()) errs.clientId = 'Client is required'
    if (!form.startDate) errs.startDate = 'Start date is required'
    if (!form.totalAmount || Number(form.totalAmount) <= 0) errs.totalAmount = 'Enter a valid amount'
    if (form.endDate && form.startDate && form.endDate < form.startDate)
      errs.endDate = 'End date must be after start date'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const paymentTerms: Record<string, unknown> = {}
    if (form.installments) paymentTerms.installments = Number(form.installments)
    if (form.frequency) paymentTerms.frequency = form.frequency

    const payload: CreateContractPayload = {
      type: form.type,
      propertyId: form.propertyId.trim(),
      clientId: form.clientId.trim(),
      startDate: form.startDate,
      totalAmount: Number(form.totalAmount),
      ...(form.agentId ? { agentId: form.agentId.trim() } : {}),
      ...(form.endDate ? { endDate: form.endDate } : {}),
      ...(Object.keys(paymentTerms).length > 0 ? { paymentTerms } : {}),
      ...(form.documentUrl ? { documentUrl: form.documentUrl.trim() } : {}),
      ...(form.notes ? { notes: form.notes.trim() } : {}),
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data: payload })
        toast.success('Contract updated')
        navigate(`/contracts/${id}`)
      } else {
        const created = await createMutation.mutateAsync(payload)
        toast.success('Contract created')
        navigate(`/contracts/${created.id}`)
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Something went wrong')
          : 'Something went wrong'
      toast.error(message)
    }
  }

  if (isEdit && loadingExisting) return <LoadingSpinner message="Loading contract..." />

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(isEdit ? `/contracts/${id}` : '/contracts')}
          className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Contract' : 'New Contract'}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-5"
      >
        {/* Type */}
        <Select
          label="Contract Type"
          required
          options={CONTRACT_TYPES}
          value={form.type}
          onChange={(e) => set('type', e.target.value as ContractType)}
        />

        {/* Property & Client */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Property ID"
            required
            value={form.propertyId}
            onChange={(e) => set('propertyId', e.target.value)}
            error={errors.propertyId}
            placeholder="UUID of the property"
          />
          <Select
            label="Client"
            required
            options={[{ value: '', label: 'Select a client...' }, ...clientOptions]}
            value={form.clientId}
            onChange={(e) => set('clientId', e.target.value)}
            error={errors.clientId}
          />
        </div>

        {/* Agent */}
        <Input
          label="Agent ID (Optional)"
          value={form.agentId}
          onChange={(e) => set('agentId', e.target.value)}
          placeholder="UUID of the assigned agent"
        />

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            required
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            error={errors.startDate}
          />
          <Input
            label="End Date"
            type="date"
            value={form.endDate}
            onChange={(e) => set('endDate', e.target.value)}
            error={errors.endDate}
          />
        </div>

        {/* Amount */}
        <Input
          label="Total Amount"
          type="number"
          required
          value={form.totalAmount}
          onChange={(e) => set('totalAmount', e.target.value)}
          error={errors.totalAmount}
          placeholder="0.00"
        />

        {/* Payment Terms */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Payment Terms (Optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Number of Installments"
              type="number"
              value={form.installments}
              onChange={(e) => set('installments', e.target.value)}
              placeholder="e.g. 12"
            />
            <Select
              label="Payment Frequency"
              options={FREQUENCY_OPTIONS}
              value={form.frequency}
              onChange={(e) => set('frequency', e.target.value)}
            />
          </div>
        </div>

        {/* Document URL */}
        <Input
          label="Document URL (Optional)"
          value={form.documentUrl}
          onChange={(e) => set('documentUrl', e.target.value)}
          placeholder="https://..."
        />

        {/* Notes */}
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any additional information..."
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate(isEdit ? `/contracts/${id}` : '/contracts')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isPending} leftIcon={<Save size={16} />}>
            {isEdit ? 'Update Contract' : 'Create Contract'}
          </Button>
        </div>
      </form>
    </div>
  )
}
