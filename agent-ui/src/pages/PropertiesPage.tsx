import { useState, useEffect, useCallback } from 'react'
import { MapPin, Bed, Bath, Maximize2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge, LoadingSpinner } from '../components/ui'
import { PropertyFilters } from '../components/properties/PropertyFilters'
import { PropertyStatusBadge } from '../components/properties/PropertyStatusBadge'
import { propertiesApi } from '../api/properties'
import type { PropertyListParams } from '../api/properties'
import { useDebounce } from '../hooks/useDebounce'
import { formatCurrency, cn } from '../utils'
import type { Property, PropertyStatus } from '../types'

export default function PropertiesPage() {
  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [city, setCity] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Data
  const [data, setData] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Detail panel
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  // ── Fetch data ────────────────────────────────────────────────────
  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      const params: PropertyListParams = {
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        city: city || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }
      const result = await propertiesApi.list(params)
      setData(result.data)
      setTotalPages(result.totalPages)
    } catch {
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, typeFilter, statusFilter, minPrice, maxPrice, bedrooms, city])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, typeFilter, statusFilter, minPrice, maxPrice, bedrooms, city])

  // ── Status change (only for assigned properties) ──────────────────
  const handleStatusChange = async (propertyId: string, newStatus: PropertyStatus) => {
    try {
      await propertiesApi.changeStatus(propertyId, newStatus)
      toast.success(`Status changed to ${newStatus}`)
      fetchProperties()
      if (selectedProperty?.id === propertyId) {
        const updated = await propertiesApi.get(propertyId)
        setSelectedProperty(updated)
      }
    } catch {
      toast.error('Failed to change status')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Properties</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Browse and manage property listings.
        </p>
      </div>

      {/* Filters */}
      <PropertyFilters
        search={search}
        onSearchChange={setSearch}
        type={typeFilter}
        onTypeChange={setTypeFilter}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        bedrooms={bedrooms}
        onBedroomsChange={setBedrooms}
        city={city}
        onCityChange={setCity}
      />

      {/* Property grid */}
      {loading ? (
        <LoadingSpinner message="Loading properties..." />
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No properties found. Try adjusting your filters.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => setSelectedProperty(property)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Property Detail Panel */}
      {selectedProperty && (
        <PropertyDetailPanel
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

// ─── Property Card ────────────────────────────────────────────────

function PropertyCard({
  property,
  onClick,
}: {
  property: Property
  onClick: () => void
}) {
  const primaryImage = property.images?.find((img) => img.isPrimary) ?? property.images?.[0]

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="h-40 bg-gray-100 dark:bg-gray-700 relative">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <MapPin size={32} />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <PropertyStatusBadge status={property.status} />
        </div>
        <div className="absolute top-2 right-2">
          <Badge variant="gray">{property.type}</Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{property.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
          <MapPin size={12} />
          {property.city}, {property.region}
        </p>
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-2">
          {formatCurrency(property.price)}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <Bed size={12} /> {property.bedrooms} BR
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath size={12} /> {property.bathrooms} BA
            </span>
          )}
          <span className="flex items-center gap-1">
            <Maximize2 size={12} /> {property.area} m²
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Property Detail Panel ────────────────────────────────────────

function PropertyDetailPanel({
  property,
  onClose,
  onStatusChange,
}: {
  property: Property
  onClose: () => void
  onStatusChange: (id: string, status: PropertyStatus) => void
}) {
  const isAssigned = !!property.assignedAgentId

  const statusOptions = ([
    { value: 'AVAILABLE' as PropertyStatus, label: 'Available' },
    { value: 'RESERVED' as PropertyStatus, label: 'Reserved' },
    { value: 'SOLD' as PropertyStatus, label: 'Sold' },
    { value: 'RENTED' as PropertyStatus, label: 'Rented' },
    { value: 'OFF_MARKET' as PropertyStatus, label: 'Off Market' },
  ] satisfies { value: PropertyStatus; label: string }[]).filter((opt) => opt.value !== property.status)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={cn(
          'relative w-full max-w-md bg-white dark:bg-gray-800 shadow-xl',
          'border-l border-gray-200 dark:border-gray-700',
          'overflow-y-auto p-6',
        )}
      >
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {property.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <PropertyStatusBadge status={property.status} />
                <Badge variant="gray">{property.type}</Badge>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Price */}
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(property.price)}
          </p>

          {/* Location */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{property.address}</p>
            <p className="text-sm text-gray-500">{property.city}, {property.region}</p>
          </div>

          {/* Details grid */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Area</span>
              <span className="text-gray-900 dark:text-gray-100">{property.area} m²</span>
              {property.bedrooms != null && (
                <>
                  <span className="text-gray-500">Bedrooms</span>
                  <span className="text-gray-900 dark:text-gray-100">{property.bedrooms}</span>
                </>
              )}
              {property.bathrooms != null && (
                <>
                  <span className="text-gray-500">Bathrooms</span>
                  <span className="text-gray-900 dark:text-gray-100">{property.bathrooms}</span>
                </>
              )}
              {property.floor != null && (
                <>
                  <span className="text-gray-500">Floor</span>
                  <span className="text-gray-900 dark:text-gray-100">{property.floor}</span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                {property.description}
              </p>
            </div>
          )}

          {/* Status Change (only if assigned) */}
          {isAssigned && statusOptions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Change Status
              </h3>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onStatusChange(property.id, opt.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 dark:hover:border-indigo-800 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isAssigned && (
            <p className="text-xs text-gray-400 italic">
              This property is not assigned to you. Status changes are read-only.
            </p>
          )}

          {/* Lead count */}
          {property._count?.leads != null && property._count.leads > 0 && (
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {property._count.leads}
              </span>{' '}
              active lead{property._count.leads !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
