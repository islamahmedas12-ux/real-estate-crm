import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Button, Select, Textarea } from '../ui'
import { leadsApi } from '../../api/leads'
import { leadActivitySchema, type LeadActivityFormData } from '../../schemas'

interface LeadActivityFormProps {
  leadId: string
  onSuccess: () => void
}

export function LeadActivityForm({ leadId, onSuccess }: LeadActivityFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadActivityFormData>({
    resolver: zodResolver(leadActivitySchema),
    defaultValues: {
      type: 'CALL',
      description: '',
    },
  })

  const onSubmit = async (data: LeadActivityFormData) => {
    try {
      await leadsApi.addActivity(leadId, data.type, data.description)
      toast.success('Activity logged')
      reset()
      onSuccess()
    } catch {
      toast.error('Failed to log activity')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Select
        label="Activity Type"
        options={[
          { value: 'CALL', label: 'Call' },
          { value: 'EMAIL', label: 'Email' },
          { value: 'MEETING', label: 'Meeting' },
          { value: 'NOTE', label: 'Note' },
          { value: 'VIEWING', label: 'Viewing' },
          { value: 'FOLLOW_UP', label: 'Follow-up' },
        ]}
        {...register('type')}
      />
      <Textarea
        label="Description"
        required
        {...register('description')}
        error={errors.description?.message}
        rows={2}
        placeholder="Describe the activity..."
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={isSubmitting}>
          Log Activity
        </Button>
      </div>
    </form>
  )
}