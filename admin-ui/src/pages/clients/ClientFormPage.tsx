import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button, Input, Select, Textarea, LoadingSpinner } from '../../components/ui'
import { useClientDetail, useCreateClient, useUpdateClient } from '../../hooks/useClients'
import toast from 'react-hot-toast'
import type { ClientType, ClientSource, CreateClientPayload } from '../../types/client'

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

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  nationalId: string
  type: ClientType
  source: ClientSource
  notes: string
}

const INITIAL: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  nationalId: '',
  type: 'BUYER',
  source: 'OTHER',
  notes: '',
}

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const { data: existing, isLoading: loadingExisting } = useClientDetail(id ?? '')
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()

  useEffect(() => {
    if (existing && isEdit) {
      setForm({
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email ?? '',
        phone: existing.phone,
        nationalId: existing.nationalId ?? '',
        type: existing.type,
        source: existing.source,
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
    if (!form.firstName.trim()) errs.firstName = 'First name is required'
    if (!form.lastName.trim()) errs.lastName = 'Last name is required'
    if (!form.phone.trim()) errs.phone = 'Phone is required'
    else if (!/^\+?[0-9]{10,15}$/.test(form.phone.trim()))
      errs.phone = 'Enter a valid phone (10-15 digits)'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateClientPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      type: form.type,
      source: form.source,
      ...(form.email ? { email: form.email.trim() } : {}),
      ...(form.nationalId ? { nationalId: form.nationalId.trim() } : {}),
      ...(form.notes ? { notes: form.notes.trim() } : {}),
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data: payload })
        toast.success('Client updated')
        navigate(`/clients/${id}`)
      } else {
        const created = await createMutation.mutateAsync(payload)
        toast.success('Client created')
        navigate(`/clients/${created.id}`)
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Something went wrong')
          : 'Something went wrong'
      toast.error(message)
    }
  }

  if (isEdit && loadingExisting) return <LoadingSpinner message="Loading client..." />

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(isEdit ? `/clients/${id}` : '/clients')}
          className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Client' : 'New Client'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            required
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            error={errors.firstName}
            placeholder="Ahmed"
          />
          <Input
            label="Last Name"
            required
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            error={errors.lastName}
            placeholder="Hassan"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
            placeholder="ahmed@example.com"
          />
          <Input
            label="Phone"
            required
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            error={errors.phone}
            placeholder="+201234567890"
          />
        </div>

        <Input
          label="National ID"
          value={form.nationalId}
          onChange={(e) => set('nationalId', e.target.value)}
          placeholder="Optional"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Client Type"
            required
            options={CLIENT_TYPES}
            value={form.type}
            onChange={(e) => set('type', e.target.value as ClientType)}
          />
          <Select
            label="Source"
            options={CLIENT_SOURCES}
            value={form.source}
            onChange={(e) => set('source', e.target.value as ClientSource)}
          />
        </div>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Any additional information..."
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate(isEdit ? `/clients/${id}` : '/clients')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isPending} leftIcon={<Save size={16} />}>
            {isEdit ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </form>
    </div>
  )
}
