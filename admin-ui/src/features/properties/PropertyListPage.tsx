import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Plus,
  LayoutGrid,
  List,
  Eye,
  Pencil,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react'
import { propertiesApi } from '../../api/properties'
import { Button, DataTable, SearchBar, LoadingSpinner } from '../../components/ui'
import { PropertyCard } from '../../components/properties/PropertyCard'
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../../types/property'
import { formatCurrency, cn } from '../../utils'
import { useDebounce } from '../../hooks/useDebounce'
import type { PropertyFilterParams, Property, PropertyType, PropertyStatus } from '../../types/property'
import type { Column } from '../../types'

type ViewMode = 'table' | 'grid'

/* ------------------------------------------------------------------ */
/*  Price range presets                                                */
/* ------------------------------------------------------------------ */
const PRICE_RANGES = [
  { label: 'Any Price', min: '', max: '' },
  { label: 'Under 500K', min: '', max: '500000' },
  { label: '500K – 1M', min: '500000', max: '1000000' },
  { label: '1M – 3M', min: '1000000', max: '3000000' },
  { label: '3M – 5M', min: '3000000', max: '5000000' },
  { label: '5M – 10M', min: '5000000', max: '10000000' },
  { label: 'Over 10M', min: '10000000', max: '' },
] as const

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function PropertyListPage() {
  const navigate = useNavigate()

  /* --- view mode --- */
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  /* --- search (debounced 300 ms) --- */
  const [rawSearch, setRawSearch] = useState('')
  const debouncedSearch = useDebounce(rawSearch, 300)

  /* --- filters --- */
  const [typeFilter, setTypeFilter] = useState<PropertyType | ''>('')
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | ''>('')
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: '',
    max: '',
  })

  /* --- pagination --- */
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  /* --- build query params --- */
  const filterParams = useMemo<PropertyFilterParams>(
    () => ({
      page,
      pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...(typeFilter && { type: typeFilter }),
      ...(statusFilter && { status: statusFilter }),
      ...(priceRange.min && { minPrice: priceRange.min }),
      ...(priceRange.max && { maxPrice: priceRange.max }),
    }),
    [page, pageSize, typeFilter, statusFilter, priceRange],
  )

  /* --- queries --- */
  const listQuery = useQuery({
    queryKey: ['properties', filterParams],
    queryFn: () => propertiesApi.list(filterParams),
    placeholderData: (prev) => prev,
  })

  const searchQuery = useQuery({
    queryKey: ['properties-search', debouncedSearch],
    queryFn: () => propertiesApi.search(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  })

  const isSearching = debouncedSearch.length >= 2
  const properties = isSearching
    ? searchQuery.data?.data
    : listQuery.data?.data
  const total = isSearching
    ? (searchQuery.data?.data?.length ?? 0)
    : (listQuery.data?.total ?? 0)
  const isLoading = isSearching ? searchQuery.isLoading : listQuery.isLoading

  /* --- handlers --- */
  const handleSearch = useCallback((q: string) => {
    setRawSearch(q)
    setPage(1)
  }, [])

  const handlePriceRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const preset = PRICE_RANGES[Number(e.target.value)]
      setPriceRange({ min: preset.min, max: preset.max })
      setPage(1)
    },
    [],
  )

  const handleClearFilters = useCallback(() => {
    setTypeFilter('')
    setStatusFilter('')
    setPriceRange({ min: '', max: '' })
    setRawSearch('')
    setPage(1)
  }, [])

  const hasActiveFilters = typeFilter || statusFilter || priceRange.min || priceRange.max

  /* ---------------------------------------------------------------- */
  /*  Table columns                                                    */
  /* ---------------------------------------------------------------- */
  const columns: Column<Property & Record<string, unknown>>[] = [
    {
      key: 'images',
      header: '',
      width: '56px',
      render: (_val, row) => {
        const img = (row as Property).images?.find((i) => i.isPrimary) ?? (row as Property).images?.[0]
        return img ? (
          <img
            src={img.url}
            alt={(row as Property).title}
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
            <ImageIcon size={16} className="text-gray-400" />
          </div>
        )
      },
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (_val, row) => (
        <div className="max-w-[220px]">
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {(row as Property).title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {(row as Property).region}, {(row as Property).city}
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
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (val) => {
        const meta = PROPERTY_STATUSES.find((s) => s.value === val)
        return (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
              meta?.color,
            )}
          >
            {meta?.label ?? String(val)}
          </span>
        )
      },
    },
    {
      key: 'assignedAgent',
      header: 'Agent',
      render: (_val, row) => {
        const agent = (row as Property).assignedAgent
        return agent ? (
          <span className="text-sm">{agent.name}</span>
        ) : (
          <span className="text-xs text-gray-400">Unassigned</span>
        )
      },
    },
    {
      key: 'id',
      header: 'Actions',
      width: '120px',
      render: (_val, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/properties/${(row as Property).id}`)
            }}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors"
            title="View"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/properties/${(row as Property).id}/edit`)
            }}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-amber-600 dark:hover:bg-gray-700 dark:hover:text-amber-400 transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              // TODO: wire up delete confirmation dialog
            }}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Properties
          </h1>
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

          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => navigate('/properties/new')}
          >
            Add Property
          </Button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col gap-3">
        <SearchBar
          onSearch={handleSearch}
          debounceMs={300}
          placeholder="Search properties by title, address, city..."
          className="max-w-md"
        />

        {!isSearching && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Property type dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as PropertyType | '')
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Status dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as PropertyStatus | '')
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              {PROPERTY_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Price range dropdown */}
            <select
              value={PRICE_RANGES.findIndex(
                (r) => r.min === priceRange.min && r.max === priceRange.max,
              )}
              onChange={handlePriceRangeChange}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PRICE_RANGES.map((r, i) => (
                <option key={i} value={i}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <LoadingSpinner message="Loading properties..." />
      ) : viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={(properties ?? []) as (Property & Record<string, unknown>)[]}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          total={total}
          onRowClick={(row) => navigate(`/properties/${(row as Property).id}`)}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(ps) => {
            setPageSize(ps)
            setPage(1)
          }}
          emptyMessage="No properties found. Try adjusting your filters."
        />
      ) : (
        <>
          {(properties?.length ?? 0) === 0 ? (
            <p className="py-12 text-center text-gray-400 dark:text-gray-500">
              No properties found. Try adjusting your filters.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties?.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
