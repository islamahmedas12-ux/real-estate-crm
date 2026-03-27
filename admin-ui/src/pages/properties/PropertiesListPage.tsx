import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, Plus, LayoutGrid, List } from 'lucide-react'
import { propertiesApi } from '../../api/properties'
import { Button, DataTable, SearchBar, LoadingSpinner } from '../../components/ui'
import { PropertyFilters } from '../../components/properties/PropertyFilters'
import { PropertyCard } from '../../components/properties/PropertyCard'
import { PROPERTY_STATUSES } from '../../types/property'
import { formatCurrency } from '../../utils'
import { cn } from '../../utils'
import type { PropertyFilterParams, Property } from '../../types/property'
import type { Column } from '../../types'

type ViewMode = 'table' | 'grid'

export default function PropertiesListPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<PropertyFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const listQuery = useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertiesApi.list(filters),
    placeholderData: (prev) => prev,
  })

  const searchQueryResult = useQuery({
    queryKey: ['properties-search', searchQuery],
    queryFn: () => propertiesApi.search(searchQuery),
    enabled: searchQuery.length >= 2,
  })

  const isSearching = searchQuery.length >= 2
  const data = isSearching ? searchQueryResult.data?.data : listQuery.data?.data
  const total = isSearching ? (searchQueryResult.data?.data?.length ?? 0) : (listQuery.data?.total ?? 0)
  const isLoading = isSearching ? searchQueryResult.isLoading : listQuery.isLoading

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
  }, [])

  const columns: Column<Property & Record<string, unknown>>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (_val, row) => (
        <div className="max-w-[220px]">
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{row.title as string}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {row.region as string}, {row.city as string}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (val) => (
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {String(val).replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (val) => {
        const meta = PROPERTY_STATUSES.find((s) => s.value === val)
        return (
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', meta?.color)}>
            {meta?.label ?? String(val)}
          </span>
        )
      },
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (val) => (
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          {formatCurrency(Number(val))}
        </span>
      ),
    },
    {
      key: 'area',
      header: 'Area',
      sortable: true,
      render: (val) => `${Number(val).toLocaleString()} m²`,
    },
    {
      key: 'bedrooms',
      header: 'Beds',
      render: (val) => (val != null ? String(val) : '-'),
    },
    {
      key: 'assignedAgent',
      header: 'Agent',
      render: (_val, row) => {
        const agent = row.assignedAgent as Property['assignedAgent']
        return agent ? (
          <span className="text-sm">{agent.name}</span>
        ) : (
          <span className="text-gray-400 text-xs">Unassigned</span>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (val) => new Date(String(val)).toLocaleDateString(),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Properties</h1>
          {!isLoading && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400',
              )}
              title="Table view"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400',
              )}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/properties/new')}>
            Add Property
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search properties by title, address, city..."
          className="max-w-md"
        />
        {!isSearching && <PropertyFilters filters={filters} onChange={setFilters} />}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner message="Loading properties..." />
      ) : viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={(data ?? []) as (Property & Record<string, unknown>)[]}
          loading={isLoading}
          page={filters.page ?? 1}
          pageSize={filters.pageSize ?? 10}
          total={total}
          onRowClick={(row) => navigate(`/properties/${row.id}`)}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          onPageSizeChange={(ps) => setFilters((f) => ({ ...f, page: 1, pageSize: ps }))}
          emptyMessage="No properties found. Try adjusting your filters."
        />
      ) : (
        <>
          {(data?.length ?? 0) === 0 ? (
            <p className="py-12 text-center text-gray-400 dark:text-gray-500">
              No properties found. Try adjusting your filters.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data?.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
