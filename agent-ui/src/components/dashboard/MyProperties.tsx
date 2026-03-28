import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { propertiesApi } from '../../api/properties'
import type { Property } from '../../types'

const statusBadge: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  RESERVED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  SOLD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  RENTED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  OFF_MARKET: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `EGP ${(price / 1_000_000).toFixed(1)}M`
  if (price >= 1_000) return `EGP ${(price / 1_000).toFixed(0)}K`
  return `EGP ${price.toLocaleString()}`
}

export function MyProperties() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['agent-my-properties'],
    queryFn: () => propertiesApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    staleTime: 60_000,
  })

  const properties = data?.data ?? []

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">My Properties</h2>
        </div>
        <button
          onClick={() => navigate('/properties')}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View all <ArrowRight size={12} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No assigned properties yet.</p>
      ) : (
        <div className="space-y-2">
          {properties.map((prop: Property) => (
            <div
              key={prop.id}
              onClick={() => navigate(`/properties/${prop.id}`)}
              className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {prop.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin size={10} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {prop.city}{prop.region ? `, ${prop.region}` : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatPrice(prop.price)}
                </span>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge[prop.status] ?? ''}`}>
                  {prop.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
