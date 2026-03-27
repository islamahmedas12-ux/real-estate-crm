import { useNavigate } from 'react-router-dom'
import { MapPin, BedDouble, Bath, Maximize2 } from 'lucide-react'
import { cn, formatCurrency } from '../../utils'
import { PROPERTY_STATUSES } from '../../types/property'
import type { Property } from '../../types/property'

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate()
  const statusMeta = PROPERTY_STATUSES.find((s) => s.value === property.status)
  const primaryImage = property.images?.find((img) => img.isPrimary) ?? property.images?.[0]

  return (
    <div
      onClick={() => navigate(`/properties/${property.id}`)}
      className={cn(
        'group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm',
        'transition-all duration-200 hover:shadow-md hover:border-indigo-300',
        'dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600',
      )}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
            <Maximize2 size={32} />
          </div>
        )}
        {statusMeta && (
          <span
            className={cn(
              'absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              statusMeta.color,
            )}
          >
            {statusMeta.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {formatCurrency(Number(property.price))}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-gray-900 line-clamp-1 dark:text-gray-100">
          {property.title}
        </h3>

        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <MapPin size={12} />
          <span className="line-clamp-1">
            {property.region}, {property.city}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble size={14} /> {property.bedrooms} bd
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath size={14} /> {property.bathrooms} ba
            </span>
          )}
          <span className="flex items-center gap-1">
            <Maximize2 size={14} /> {Number(property.area).toLocaleString()} m²
          </span>
        </div>

        <p className="mt-2 rounded bg-gray-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-700/50 dark:text-gray-400 w-fit">
          {property.type.replace('_', ' ')}
        </p>
      </div>
    </div>
  )
}
