import { CalendarCheck, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import { cn } from '../../utils'

type TaskPriority = 'high' | 'medium' | 'low'

interface Task {
  id: string
  title: string
  dueDate: string
  dueLabel: string
  priority: TaskPriority
  category: string
}

const TASKS: Task[] = [
  {
    id: '1',
    title: 'Prepare contract for Villa in New Cairo',
    dueDate: '2026-03-25',
    dueLabel: 'Today',
    priority: 'high',
    category: 'Contract',
  },
  {
    id: '2',
    title: 'Schedule viewing — Penthouse in Maadi',
    dueDate: '2026-03-25',
    dueLabel: 'Today',
    priority: 'high',
    category: 'Viewing',
  },
  {
    id: '3',
    title: 'Send updated brochure to Nour Abdallah',
    dueDate: '2026-03-26',
    dueLabel: 'Tomorrow',
    priority: 'medium',
    category: 'Marketing',
  },
  {
    id: '4',
    title: 'Follow up on deposit — Layla Ibrahim',
    dueDate: '2026-03-26',
    dueLabel: 'Tomorrow',
    priority: 'medium',
    category: 'Payment',
  },
  {
    id: '5',
    title: 'Review new listings in Sheikh Zayed',
    dueDate: '2026-03-27',
    dueLabel: 'Thu, Mar 27',
    priority: 'low',
    category: 'Listings',
  },
  {
    id: '6',
    title: 'Quarterly commission report',
    dueDate: '2026-03-28',
    dueLabel: 'Fri, Mar 28',
    priority: 'low',
    category: 'Admin',
  },
]

const priorityConfig: Record<TaskPriority, { color: string; bg: string; label: string }> = {
  high:   { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', label: 'High' },
  medium: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', label: 'Medium' },
  low:    { color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-700/50', label: 'Low' },
}

export function UpcomingTasks() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarCheck size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Upcoming Tasks</h2>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {TASKS.length} tasks
        </span>
      </div>

      <div className="space-y-2">
        {TASKS.map((task) => {
          const priority = priorityConfig[task.priority]
          const isToday = task.dueLabel === 'Today'

          return (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 rounded-lg p-3 transition-colors cursor-pointer',
                'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                'border border-gray-100 dark:border-gray-700',
              )}
            >
              <div className={cn('rounded-md px-1.5 py-0.5', priority.bg)}>
                {task.priority === 'high' ? (
                  <AlertCircle size={14} className={priority.color} />
                ) : (
                  <Clock size={14} className={priority.color} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn(
                    'text-xs',
                    isToday ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400',
                  )}>
                    {task.dueLabel}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">&middot;</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{task.category}</span>
                </div>
              </div>

              <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
