import { Search } from 'lucide-react'
import { Input, Select } from '../ui'

interface PropertyFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  type: string
  onTypeChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  minPrice: string
  onMinPriceChange: (v: string) => void
  maxPrice: string
  onMaxPriceChange: (v: string) => void
  bedrooms: string
  onBedroomsChange: (v: string) => void
  city: string
  onCityChange: (v: string) => void
}

const typeOptions = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'LAND', label: 'Land' },
  { value: 'BUILDING', label: 'Building' },
  { value: 'CHALET', label: 'Chalet' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
]

const statusOptions = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'RENTED', label: 'Rented' },
  { value: 'OFF_MARKET', label: 'Off Market' },
]

const bedroomOptions = [
  { value: '1', label: '1 BR' },
  { value: '2', label: '2 BR' },
  { value: '3', label: '3 BR' },
  { value: '4', label: '4 BR' },
  { value: '5', label: '5+ BR' },
]

export function PropertyFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  bedrooms,
  onBedroomsChange,
  city,
  onCityChange,
}: PropertyFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search properties..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            leftAddon={<Search size={16} />}
          />
        </div>
        <div className="w-36">
          <Select
            options={typeOptions}
            placeholder="All types"
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Select
            options={statusOptions}
            placeholder="All statuses"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          />
        </div>
        <div className="w-32">
          <Select
            options={bedroomOptions}
            placeholder="Bedrooms"
            value={bedrooms}
            onChange={(e) => onBedroomsChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-36">
          <Input
            placeholder="Min price"
            type="number"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Input
            placeholder="Max price"
            type="number"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
          />
        </div>
        <div className="w-36">
          <Input
            placeholder="City"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
