import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Button, Input, Select, Textarea } from '../ui'
import { clientsApi } from '../../api/clients'
import { clientFormSchema, type ClientFormData } from '../../schemas'

interface ClientFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function ClientForm({ onSuccess, onCancel }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      nationalId: '',
      type: 'BUYER',
      source: 'WEBSITE',
      notes: '',
    },
  })

  const onSubmit = async (data: ClientFormData) => {
    try {
      await clientsApi.create({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || undefined,
        nationalId: data.nationalId || undefined,
        type: data.type,
        source: data.source,
        notes: data.notes || undefined,
      })
      toast.success('Client created successfully')
      onSuccess()
    } catch {
      toast.error('Failed to create client')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First Name"
          required
          {...register('firstName')}
          error={errors.firstName?.message}
        />
        <Input
          label="Last Name"
          required
          {...register('lastName')}
          error={errors.lastName?.message}
        />
      </div>
      <Input
        label="Phone"
        required
        {...register('phone')}
        error={errors.phone?.message}
        placeholder="+20..."
      />
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <Input
        label="National ID"
        {...register('nationalId')}
        error={errors.nationalId?.message}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type"
          required
          options={[
            { value: 'BUYER', label: 'Buyer' },
            { value: 'SELLER', label: 'Seller' },
            { value: 'TENANT', label: 'Tenant' },
            { value: 'LANDLORD', label: 'Landlord' },
            { value: 'INVESTOR', label: 'Investor' },
          ]}
          {...register('type')}
        />
        <Select
          label="Source"
          required
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
      </div>
      <Textarea
        label="Notes"
        {...register('notes')}
        rows={3}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create Client
        </Button>
      </div>
    </form>
  )
}