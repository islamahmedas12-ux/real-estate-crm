import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Select, Textarea } from '../ui'
import { leadsApi } from '../../api/leads'

interface LeadActivityFormProps {
  leadId: string
  onSuccess: () => void
}

const activityTypes = [
  { value: 'CALL', label: 'Call' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'NOTE', label: 'Note' },
  { value: 'VIEWING', label: 'Viewing' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
]

export function LeadActivityForm({ leadId, onSuccess }: LeadActivityFormProps) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('CALL')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error('Description is required')
      return
    }
    setLoading(true)
    try {
      await leadsApi.addActivity(leadId, type, description)
      toast.success('Activity logged')
      setDescription('')
      onSuccess()
    } catch {
      toast.error('Failed to log activity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Select
        label="Activity Type"
        options={activityTypes}
        value={type}
        onChange={(e) => setType(e.target.value)}
      />
      <Textarea
        label="Description"
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Describe the activity..."
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={loading}>
          Log Activity
        </Button>
      </div>
    </form>
  )
}
