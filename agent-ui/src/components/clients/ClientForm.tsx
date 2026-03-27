import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Input, Select, Textarea } from '../ui'
import { clientsApi } from '../../api/clients'
import type { CreateClientPayload, ClientType, ClientSource } from '../../types'

interface ClientFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const typeOptions = [
  { value: 'BUYER', label: 'Buyer' },
  { value: 'SELLER', label: 'Seller' },
  { value: 'TENANT', label: 'Tenant' },
  { value: 'LANDLORD', label: 'Landlord' },
  { value: 'INVESTOR', label: 'Investor' },
]

const sourceOptions = [
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'ADVERTISEMENT', label: 'Advertisement' },
  { value: 'OTHER', label: 'Other' },
]

export function ClientForm({ onSuccess, onCancel }: ClientFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateClientPayload>({
    firstName: '',
    lastName: '',
    phone: '',
    type: 'BUYER',
    source: 'WEBSITE',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      toast.error('First name, last name, and phone are required')
      return
    }
    setLoading(true)
    try {
      await clientsApi.create(form)
      toast.success('Client created successfully')
      onSuccess()
    } catch {
      toast.error('Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First Name"
          required
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <Input
          label="Last Name"
          required
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </div>
      <Input
        label="Phone"
        required
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        placeholder="+20..."
      />
      <Input
        label="Email"
        type="email"
        value={form.email ?? ''}
        onChange={(e) => setForm({ ...form, email: e.target.value || undefined })}
      />
      <Input
        label="National ID"
        value={form.nationalId ?? ''}
        onChange={(e) => setForm({ ...form, nationalId: e.target.value || undefined })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type"
          required
          options={typeOptions}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as ClientType })}
        />
        <Select
          label="Source"
          required
          options={sourceOptions}
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value as ClientSource })}
        />
      </div>
      <Textarea
        label="Notes"
        value={form.notes ?? ''}
        onChange={(e) => setForm({ ...form, notes: e.target.value || undefined })}
        rows={3}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create Client
        </Button>
      </div>
    </form>
  )
}
