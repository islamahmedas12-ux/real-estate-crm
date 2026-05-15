import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Button, Input, Select, Textarea } from '../ui'
import { leadsApi } from '../../api/leads'
import { leadFormSchema, type LeadFormData } from '../../schemas'

interface LeadFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function LeadForm({ onSuccess, onCancel }: LeadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      clientId: '',
      propertyId: '',
      source: 'WEBSITE',
      priority: 'MEDIUM',
    },
  })

  const onSubmit = async (data: LeadFormData) => {
    try {
      await leadsApi.create({
        clientId: data.clientId,
        propertyId: data.propertyId || undefined,
        source: data.source,
        priority: data.priority,
        budget: data.budget ? Number(data.budget) : undefined,
        notes: data.notes || undefined,
        nextFollowUp: data.nextFollowUp || undefined,
      })
      toast.success('Lead created successfully')
      onSuccess()
    } catch {
      toast.error('Failed to create lead')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Client ID"
        required
        {...register('clientId')}
        error={errors.clientId?.message}
        placeholder="Enter client ID"
      />
      <Input
        label="Property ID"
        {...register('propertyId')}
        placeholder="Enter property ID (optional)"
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Source"
          options={[
            { value: 'REFERRAL', label: 'Referral' },
            { value: 'WEBSITE', label: 'Website' },
            { value: 'SOCIAL_MEDIA', label: 'Social Media' },
            { value: 'WALK_IN', label: 'Walk-in' },
            { value: 'PHONE', label: 'Phone' },
            { value: 'ADVERTISEMENT', label: 'Advertisement' },
            { value: 'OTHER', label: 'Other' },
          ]}
          {...register('source')}
        />
        <Select
          label="Priority"
          options={[
            { value: 'LOW', label: 'Low' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' },
            { value: 'URGENT', label: 'Urgent' },
          ]}
          {...register('priority')}
        />
      </div>
      <Input
        label="Budget"
        type="number"
        {...register('budget')}
        placeholder="0"
      />
      <Input
        label="Next Follow-up"
        type="datetime-local"
        {...register('nextFollowUp')}
      />
      <Textarea
        label="Notes"
        {...register('notes')}
        rows={3}
        placeholder="Additional notes..."
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create Lead
        </Button>
      </div>
    </form>
  )
}