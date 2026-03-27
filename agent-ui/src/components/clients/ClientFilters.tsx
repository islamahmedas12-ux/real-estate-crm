import { Search } from 'lucide-react'
import { Input, Select } from '../ui'

interface ClientFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  type: string
  onTypeChange: (v: string) => void
  source: string
  onSourceChange: (v: string) => void
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

export function ClientFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  source,
  onSourceChange,
}: ClientFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 max-w-xs">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftAddon={<Search size={16} />}
        />
      </div>
      <div className="w-40">
        <Select
          options={typeOptions}
          placeholder="All types"
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
        />
      </div>
      <div className="w-40">
        <Select
          options={sourceOptions}
          placeholder="All sources"
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
        />
      </div>
    </div>
  )
}
