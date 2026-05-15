import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '../../utils'
import { Skeleton } from './Skeleton'
import type { Column } from '../../types'

type MobileLayout = 'cards' | 'scroll'
type SortDir = 'asc' | 'desc' | null

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  keyField?: string
  mobileLayout?: MobileLayout
  actionsColumn?: number
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onPageSizeChange,
  keyField = 'id',
  mobileLayout = 'cards',
  actionsColumn,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<Record<string, boolean>>({})

  const SORT_CYCLE: SortDir[] = ['asc', 'desc', null]

  function handleSort(key: string) {
    if (sortKey === key) {
      const idx = SORT_CYCLE.indexOf(sortDir)
      const next = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]
      setSortDir(next)
      if (next === null) setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(
    () => [...data].sort((a, b) => {
      if (!sortKey || !sortDir) return 0
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === bv) return 0
      const dir = sortDir === 'asc' ? 1 : -1
      return (av ?? '') > (bv ?? '') ? dir : -dir
    }),
    [data, sortKey, sortDir],
  )

  const totalPages = useMemo(() => (total ? Math.ceil(total / pageSize) : 1), [total, pageSize])

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortKey !== colKey) return <ChevronsUpDown size={14} className="text-gray-400" />
    if (sortDir === 'asc') return <ChevronUp size={14} className="text-indigo-500" />
    return <ChevronDown size={14} className="text-indigo-500" />
  }

  // Below 768px: render card layout if mobileLayout='cards'
  const showCards = mobileLayout === 'cards'
  const primaryCol = columns[0]
  const secondaryCols = columns.slice(1)

  return (
    <div className="flex flex-col gap-3" data-datatable>
      {showCards ? (
        /* ── Mobile card view ── */
        <div className="flex flex-col gap-3">
          {loading ? (
            Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2">
                {columns.map((col) => (
                  <div key={col.key} className="space-y-1">
                    <Skeleton height="h-3" width="w-1/3" />
                    <Skeleton height="h-4" width="w-2/3" />
                  </div>
                ))}
              </div>
            ))
          ) : sorted.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-gray-400 dark:text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            sorted.map((row, i) => {
              const rowKey = String(row[keyField] ?? i)
              return (
                <div
                  key={rowKey}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2',
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30',
                  )}
                >
                  {/* Primary field as card title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {primaryCol.render
                        ? primaryCol.render(row[primaryCol.key], row)
                        : String(row[primaryCol.key] ?? '')}
                    </div>
                    {actionsColumn !== undefined && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setMobileMenuOpen((prev) => ({ ...prev, [rowKey]: !prev[rowKey] })) }}
                        className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    )}
                  </div>
                  {/* Secondary fields */}
                  {secondaryCols.map((col) => (
                    <div key={col.key} className="flex justify-between gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{col.header}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                      </span>
                    </div>
                  ))}
                  {/* Dropdown menu */}
                  {actionsColumn !== undefined && mobileMenuOpen[rowKey] && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      {columns[actionsColumn]?.render
                        ? columns[actionsColumn].render(row[columns[actionsColumn].key], row)
                        : null}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* ── Desktop table view ── */
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                      col.sortable && 'cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-200',
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && <SortIcon colKey={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
              {loading ? (
                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <Skeleton height="h-4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sorted.map((row, i) => (
                  <tr
                    key={String(row[keyField] ?? i)}
                    onClick={() => onRowClick?.(row)}
                    tabIndex={onRowClick ? 0 : undefined}
                    data-datatable-row
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-indigo-900/10',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap"
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {(onPageChange || total !== undefined) && !showCards && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span>
              {total !== undefined && `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange?.(page + 1)}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
