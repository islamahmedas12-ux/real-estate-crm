import { Search } from 'lucide-react'
import { Input, Select } from '../ui'

interface LeadFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  priority: string
  onPriorityChange: (v: string) => void
}

const statusOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL', label: 'Proposal' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'WON', label: 'Won' },
  { value: 'LOST', label: 'Lost' },
]

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

export function LeadFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
}: LeadFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 max-w-xs">
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftAddon={<Search size={16} />}
        />
      </div>
      <div className="w-40">
        <Select
          options={statusOptions}
          placeholder="All statuses"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        />
      </div>
      <div className="w-40">
        <Select
          options={priorityOptions}
          placeholder="All priorities"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
        />
      </div>
    </div>
  )
}
