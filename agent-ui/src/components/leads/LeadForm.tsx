import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Input, Select, Textarea } from '../ui'
import { leadsApi } from '../../api/leads'
import type { CreateLeadPayload } from '../../types'

interface LeadFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const sourceOptions = [
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'ADVERTISEMENT', label: 'Advertisement' },
  { value: 'OTHER', label: 'Other' },
]

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

export function LeadForm({ onSuccess, onCancel }: LeadFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateLeadPayload>({
    clientId: '',
    source: 'WEBSITE',
    priority: 'MEDIUM',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientId.trim()) {
      toast.error('Client ID is required')
      return
    }
    setLoading(true)
    try {
      await leadsApi.create(form)
      toast.success('Lead created successfully')
      onSuccess()
    } catch {
      toast.error('Failed to create lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Client ID"
        required
        value={form.clientId}
        onChange={(e) => setForm({ ...form, clientId: e.target.value })}
        placeholder="Enter client ID"
      />
      <Input
        label="Property ID"
        value={form.propertyId ?? ''}
        onChange={(e) => setForm({ ...form, propertyId: e.target.value || undefined })}
        placeholder="Enter property ID (optional)"
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Source"
          options={sourceOptions}
          value={form.source ?? ''}
          onChange={(e) => setForm({ ...form, source: e.target.value as CreateLeadPayload['source'] })}
        />
        <Select
          label="Priority"
          options={priorityOptions}
          value={form.priority ?? ''}
          onChange={(e) => setForm({ ...form, priority: e.target.value as CreateLeadPayload['priority'] })}
        />
      </div>
      <Input
        label="Budget"
        type="number"
        value={form.budget ?? ''}
        onChange={(e) => setForm({ ...form, budget: e.target.value ? Number(e.target.value) : undefined })}
        placeholder="0"
      />
      <Input
        label="Next Follow-up"
        type="datetime-local"
        value={form.nextFollowUp ?? ''}
        onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value || undefined })}
      />
      <Textarea
        label="Notes"
        value={form.notes ?? ''}
        onChange={(e) => setForm({ ...form, notes: e.target.value || undefined })}
        rows={3}
        placeholder="Additional notes..."
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create Lead
        </Button>
      </div>
    </form>
  )
}
