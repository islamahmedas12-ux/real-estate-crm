import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button, Input, Select, Textarea, LoadingSpinner } from '../../components/ui'
import { useLeadDetail, useCreateLead, useUpdateLead } from '../../hooks/useLeads'
import { useClientsList } from '../../hooks/useClients'
import toast from 'react-hot-toast'
import type { LeadStatus, LeadPriority, CreateLeadPayload } from '../../types/lead'

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

const LEAD_SOURCES = [
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Walk-in', label: 'Walk-in' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Other', label: 'Other' },
]

interface FormState {
  clientId: string
  propertyId: string
  status: LeadStatus
  priority: LeadPriority
  source: string
  budget: string
  notes: string
  nextFollowUp: string
}

const INITIAL: FormState = {
  clientId: '',
  propertyId: '',
  status: 'NEW',
  priority: 'MEDIUM',
  source: '',
  budget: '',
  notes: '',
  nextFollowUp: '',
}

export default function LeadFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const { data: existing, isLoading: loadingExisting } = useLeadDetail(id ?? '')
  const { data: clientsData } = useClientsList({ page: 1, pageSize: 200 })
  const createMutation = useCreateLead()
  const updateMutation = useUpdateLead()

  useEffect(() => {
    if (existing && isEdit) {
      setForm({
        clientId: existing.clientId,
        propertyId: existing.propertyId ?? '',
        status: existing.status,
        priority: existing.priority,
        source: existing.source ?? '',
        budget: existing.budget != null ? String(existing.budget) : '',
        notes: existing.notes ?? '',
        nextFollowUp: existing.nextFollowUp
          ? new Date(existing.nextFollowUp).toISOString().slice(0, 16)
          : '',
      })
    }
  }, [existing, isEdit])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.clientId) errs.clientId = 'Client is required'
    if (form.budget && isNaN(Number(form.budget))) errs.budget = 'Budget must be a number'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateLeadPayload = {
      clientId: form.clientId,
      status: form.status,
      priority: form.priority,
      ...(form.propertyId ? { propertyId: form.propertyId } : {}),
      ...(form.source ? { source: form.source } : {}),
      ...(form.budget ? { budget: Number(form.budget) } : {}),
      ...(form.notes ? { notes: form.notes.trim() } : {}),
      ...(form.nextFollowUp ? { nextFollowUp: new Date(form.nextFollowUp).toISOString() } : {}),
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data: payload })
        toast.success('Lead updated')
        navigate(`/leads/${id}`)
      } else {
        const created = await createMutation.mutateAsync(payload)
        toast.success('Lead created')
        navigate(`/leads/${created.id}`)
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Something went wrong')
          : 'Something went wrong'
      toast.error(message)
    }
  }

  const clientOptions = (clientsData?.data ?? []).map((c) => ({
    value: c.id,
    label: `${c.firstName} ${c.lastName} (${c.phone})`,
  }))

  if (isEdit && loadingExisting) return <LoadingSpinner message="Loading lead..." />

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(isEdit ? `/leads/${id}` : '/leads')}
          className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Lead' : 'New Lead'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-5">
        <Select
          label="Client"
          required
          options={clientOptions}
          placeholder="Select a client..."
          value={form.clientId}
          onChange={(e) => set('clientId', e.target.value)}
          error={errors.clientId}
        />

        <Input
          label="Property ID"
          value={form.propertyId}
          onChange={(e) => set('propertyId', e.target.value)}
          placeholder="Optional property UUID"
          hint="Leave empty if no specific property"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            options={LEAD_STATUSES}
            value={form.status}
            onChange={(e) => set('status', e.target.value as LeadStatus)}
          />
          <Select
            label="Priority"
            options={LEAD_PRIORITIES}
            value={form.priority}
            onChange={(e) => set('priority', e.target.value as LeadPriority)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Source"
            options={[{ value: '', label: 'None' }, ...LEAD_SOURCES]}
            value={form.source}
            onChange={(e) => set('source', e.target.value)}
          />
          <Input
            label="Budget"
            type="number"
            value={form.budget}
            onChange={(e) => set('budget', e.target.value)}
            error={errors.budget}
            placeholder="500000"
          />
        </div>

        <Input
          label="Next Follow-up"
          type="datetime-local"
          value={form.nextFollowUp}
          onChange={(e) => set('nextFollowUp', e.target.value)}
        />

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any additional details..."
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate(isEdit ? `/leads/${id}` : '/leads')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isPending} leftIcon={<Save size={16} />}>
            {isEdit ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </div>
  )
}
