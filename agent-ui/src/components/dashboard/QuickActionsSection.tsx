import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, ClipboardList, Zap } from 'lucide-react'
import { cn } from '../../utils'

function SectionShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5', className)}>
      {children}
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-gray-500 dark:text-gray-400" />
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
      </div>
    </div>
  )
}

const ACTIONS = [
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

export function QuickActionsSection() {
  const navigate = useNavigate()

  return (
    <SectionShell>
      <SectionHeader icon={Zap} title="Quick Actions" />
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
    </SectionShell>
  )
}