import { useState } from 'react'
import { Filter, X, RotateCcw } from 'lucide-react'
import { Button, Input, Select } from '../ui'
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../../types/property'
import type { PropertyFilterParams } from '../../types/property'
import { cn } from '../../utils'

interface PropertyFiltersProps {
  filters: PropertyFilterParams
  onChange: (filters: PropertyFilterParams) => void
  className?: string
}

export function PropertyFilters({ filters, onChange, className }: PropertyFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeCount = [
    filters.type,
    filters.status,
    filters.city,
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
  ].filter(Boolean).length

  function handleReset() {
    onChange({
      page: 1,
      pageSize: filters.pageSize,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    })
  }

  function update(patch: Partial<PropertyFilterParams>) {
    onChange({ ...filters, page: 1, ...patch })
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Toggle button for mobile / collapsed */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Filter size={14} />}
          onClick={() => setIsOpen((o) => !o)}
        >
          Filters
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={14} />} onClick={handleReset}>
            Clear all
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {isOpen && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter Properties</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Property Type"
              placeholder="All types"
              value={filters.type ?? ''}
              onChange={(e) => update({ type: (e.target.value || undefined) as PropertyFilterParams['type'] })}
              options={PROPERTY_TYPES}
            />

            <Select
              label="Status"
              placeholder="All statuses"
              value={filters.status ?? ''}
              onChange={(e) => update({ status: (e.target.value || undefined) as PropertyFilterParams['status'] })}
              options={PROPERTY_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />

            <Input
              label="City"
              placeholder="e.g. Cairo"
              value={filters.city ?? ''}
              onChange={(e) => update({ city: e.target.value || undefined })}
            />

            <Input
              label="Min Bedrooms"
              type="number"
              min={0}
              placeholder="Any"
              value={filters.bedrooms ?? ''}
              onChange={(e) => update({ bedrooms: e.target.value ? Number(e.target.value) : undefined })}
            />

            <Input
              label="Min Price"
              type="number"
              min={0}
              placeholder="0"
              value={filters.minPrice ?? ''}
              onChange={(e) => update({ minPrice: e.target.value || undefined })}
            />

            <Input
              label="Max Price"
              type="number"
              min={0}
              placeholder="No limit"
              value={filters.maxPrice ?? ''}
              onChange={(e) => update({ maxPrice: e.target.value || undefined })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
