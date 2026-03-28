import { CheckCircle, Circle } from 'lucide-react'
import { cn } from '../../utils'
import type { ContractStatus } from '../../types/contract'

const STATUSES: { status: ContractStatus; label: string; color: string }[] = [
  { status: 'DRAFT', label: 'Draft', color: 'gray' },
  { status: 'ACTIVE', label: 'Active', color: 'green' },
  { status: 'COMPLETED', label: 'Completed', color: 'blue' },
]

const STATUS_ORDER: Record<string, number> = {
  DRAFT: 0,
  ACTIVE: 1,
  COMPLETED: 2,
  CANCELLED: -1,
  EXPIRED: -1,
}

const colorMap: Record<string, { active: string; line: string }> = {
  gray: { active: 'text-gray-500 dark:text-gray-400', line: 'bg-gray-300 dark:bg-gray-600' },
  green: { active: 'text-green-500 dark:text-green-400', line: 'bg-green-400 dark:bg-green-600' },
  blue: { active: 'text-blue-500 dark:text-blue-400', line: 'bg-blue-400 dark:bg-blue-600' },
}

interface Props {
  currentStatus: ContractStatus
}

export function StatusTimeline({ currentStatus }: Props) {
  const currentOrder = STATUS_ORDER[currentStatus] ?? -1
  const isCancelledOrExpired = currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED'

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Contract Timeline
      </h3>

      {isCancelledOrExpired ? (
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
              currentStatus === 'CANCELLED'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            )}
          >
            {currentStatus}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            This contract has been {currentStatus.toLowerCase()}.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-0">
          {STATUSES.map((s, i) => {
            const order = STATUS_ORDER[s.status]
            const isCompleted = order < currentOrder
            const isCurrent = s.status === currentStatus
            const colors = colorMap[s.color]

            return (
              <div key={s.status} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {isCompleted ? (
                    <CheckCircle size={24} className={colors.active} />
                  ) : isCurrent ? (
                    <div className="relative">
                      <Circle size={24} className={colors.active} />
                      <div className={cn('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full', colors.line)} />
                    </div>
                  ) : (
                    <Circle size={24} className="text-gray-300 dark:text-gray-600" />
                  )}
                  <span
                    className={cn(
                      'text-[10px] font-medium mt-1',
                      isCompleted || isCurrent ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STATUSES.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-2 rounded-full',
                      order < currentOrder ? colors.line : 'bg-gray-200 dark:bg-gray-700',
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
