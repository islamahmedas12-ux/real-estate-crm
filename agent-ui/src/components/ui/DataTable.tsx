import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react'
import { cn } from '../../utils'
import { Pagination } from './Pagination'
import { EmptyState } from './EmptyState'
import { LoadingSpinner } from './LoadingSpinner'
import type { Column } from '../../types'
import { useState } from 'react'

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onRowClick?: (row: T) => void
  rowKey?: (row: T) => string
  emptyTitle?: string
  emptyDescription?: string
  className?: string
  mobileLayout?: 'cards' | 'scroll'
  actionsColumn?: number
}

export function DataTable<T extends object>({
  columns,
  data,
  loading,
  page,
  totalPages,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  rowKey,
  emptyTitle,
  emptyDescription,
  className,
  mobileLayout = 'cards',
  actionsColumn,
}: DataTableProps<T>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<Record<string, boolean>>({})

  if (loading) return <LoadingSpinner message="Loading data..." />

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  const getSortIcon = (key: string) => {
    if (sortBy !== key) return <ArrowUpDown size={14} className="text-gray-400" />
    return sortOrder === 'asc' ? (
      <ArrowUp size={14} className="text-indigo-600 dark:text-indigo-400" />
    ) : (
      <ArrowDown size={14} className="text-indigo-600 dark:text-indigo-400" />
    )
  }

  const showCards = mobileLayout === 'cards'

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {showCards ? (
        /* ── Mobile card view ── */
        <div className="flex flex-col gap-3">
          {data.map((row, idx) => {
            const rowK = rowKey ? rowKey(row) : String(idx)
            const primaryCol = columns[0]
            const secondaryCols = columns.slice(1)
            return (
              <div
                key={rowK}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2',
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {primaryCol.render
                      ? primaryCol.render((row as Record<string, unknown>)[primaryCol.key], row)
                      : String((row as Record<string, unknown>)[primaryCol.key] ?? '')}
                  </div>
                  {actionsColumn !== undefined && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setMobileMenuOpen((prev) => ({ ...prev, [rowK]: !prev[rowK] })) }}
                      className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  )}
                </div>
                {secondaryCols.map((col) => (
                  <div key={col.key} className="flex justify-between gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{col.header}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {col.render
                        ? col.render((row as Record<string, unknown>)[col.key], row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </span>
                  </div>
                ))}
                {actionsColumn !== undefined && mobileMenuOpen[rowK] && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    {columns[actionsColumn]?.render
                      ? columns[actionsColumn].render((row as Record<string, unknown>)[columns[actionsColumn].key], row)
                      : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Desktop table view ── */
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                      col.sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200',
                    )}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && getSortIcon(col.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {data.map((row, idx) => (
                <tr
                  key={rowKey ? rowKey(row) : idx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >
                      {col.render
                        ? col.render((row as Record<string, unknown>)[col.key], row)
                        : (String((row as Record<string, unknown>)[col.key] ?? '-'))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {page && totalPages && onPageChange && !showCards && (
        <div className="flex justify-center">
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  )
}
