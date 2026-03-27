import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '../../utils'
import { Pagination } from './Pagination'
import { EmptyState } from './EmptyState'
import { LoadingSpinner } from './LoadingSpinner'
import type { Column } from '../../types'

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
}: DataTableProps<T>) {
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

  return (
    <div className={cn('flex flex-col gap-4', className)}>
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
      {page && totalPages && onPageChange && (
        <div className="flex justify-center">
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  )
}
