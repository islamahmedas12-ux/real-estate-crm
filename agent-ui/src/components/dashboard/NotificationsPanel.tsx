import { Bell, Info, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { cn } from '../../utils'

type NotificationType = 'info' | 'warning' | 'success'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  time: string
  read: boolean
}

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Deal Closed',
    message: 'Contract signed for Apartment in Zamalek — EGP 3.2M',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Follow-up Overdue',
    message: 'Mohamed Farid has not been contacted in 5 days',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'New Lead Assigned',
    message: 'Hana Soliman is interested in properties in New Cairo',
    time: '3 hours ago',
    read: false,
  },
  {
    id: '4',
    type: 'info',
    title: 'Price Update',
    message: 'Villa in Katameya Heights price reduced to EGP 8.5M',
    time: '5 hours ago',
    read: true,
  },
  {
    id: '5',
    type: 'success',
    title: 'Commission Paid',
    message: 'EGP 45,000 commission deposited for Maadi Penthouse',
    time: 'Yesterday',
    read: true,
  },
]

const typeConfig: Record<NotificationType, { icon: typeof Info; color: string; bg: string }> = {
  info:    { icon: Info,          color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  success: { icon: CheckCircle,   color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
}

export function NotificationsPanel() {
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Notifications</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          Mark all read
        </button>
      </div>

      <div className="space-y-2">
        {NOTIFICATIONS.map((notification) => {
          const config = typeConfig[notification.type]
          const Icon = config.icon

          return (
            <div
              key={notification.id}
              className={cn(
                'flex items-start gap-3 rounded-lg p-3 transition-colors',
                'border border-gray-100 dark:border-gray-700',
                !notification.read && 'bg-indigo-50/40 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30',
              )}
            >
              <div className={cn('mt-0.5 rounded-md p-1.5', config.bg)}>
                <Icon size={14} className={config.color} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    'text-sm text-gray-900 dark:text-gray-100',
                    !notification.read && 'font-medium',
                  )}>
                    {notification.title}
                  </p>
                  <button className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 shrink-0">
                    <X size={12} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notification.message}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{notification.time}</p>
              </div>

              {!notification.read && (
                <div className="mt-1.5 h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
