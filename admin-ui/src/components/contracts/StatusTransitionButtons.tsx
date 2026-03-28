import { ArrowRight, Ban, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '../ui'
import type { ContractStatus } from '../../types/contract'

// Define valid status transitions
const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'CANCELLED', 'EXPIRED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
}

const TRANSITION_CONFIG: Record<ContractStatus, { label: string; icon: React.ReactNode; variant: 'primary' | 'secondary'; colorClass?: string }> = {
  DRAFT: { label: 'Draft', icon: <Clock size={14} />, variant: 'secondary' },
  ACTIVE: { label: 'Activate', icon: <CheckCircle size={14} />, variant: 'primary', colorClass: 'bg-green-600 hover:bg-green-700 text-white' },
  COMPLETED: { label: 'Complete', icon: <ArrowRight size={14} />, variant: 'primary', colorClass: 'bg-blue-600 hover:bg-blue-700 text-white' },
  CANCELLED: { label: 'Cancel', icon: <XCircle size={14} />, variant: 'secondary', colorClass: 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20' },
  EXPIRED: { label: 'Mark Expired', icon: <Ban size={14} />, variant: 'secondary', colorClass: 'border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20' },
}

interface Props {
  currentStatus: ContractStatus
  onTransition: (newStatus: ContractStatus) => void
  loading?: boolean
}

export function StatusTransitionButtons({ currentStatus, onTransition, loading }: Props) {
  const validNext = VALID_TRANSITIONS[currentStatus] ?? []

  if (validNext.length === 0) {
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500 italic">
        No further status transitions available.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {validNext.map((status) => {
        const config = TRANSITION_CONFIG[status]
        return (
          <Button
            key={status}
            size="sm"
            variant={config.variant}
            leftIcon={config.icon}
            onClick={() => onTransition(status)}
            loading={loading}
            className={config.colorClass}
          >
            {config.label}
          </Button>
        )
      })}
    </div>
  )
}
