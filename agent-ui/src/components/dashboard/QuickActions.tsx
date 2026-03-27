import { UserPlus, Users, ClipboardList, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../utils'

interface QuickAction {
  label: string
  description: string
  icon: typeof UserPlus
  color: string
  bg: string
  path: string
}

const ACTIONS: QuickAction[] = [
  {
    label: 'Add Lead',
    description: 'Capture a new prospect',
    icon: UserPlus,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    path: '/leads',
  },
  {
    label: 'Add Client',
    description: 'Register a new client',
    icon: Users,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/30',
    path: '/clients',
  },
  {
    label: 'Log Activity',
    description: 'Record a call or meeting',
    icon: ClipboardList,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    path: '/activities',
  },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-gray-500 dark:text-gray-400" />
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Quick Actions</h2>
      </div>

      <div className="space-y-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors',
                'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                'border border-gray-100 dark:border-gray-700',
              )}
            >
              <div className={cn('rounded-lg p-2', action.bg)}>
                <Icon size={18} className={action.color} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
