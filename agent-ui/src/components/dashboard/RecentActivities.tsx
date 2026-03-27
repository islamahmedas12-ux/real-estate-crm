import { Activity, Phone, Mail, Eye, FileSignature, DollarSign, UserPlus } from 'lucide-react'
import { cn } from '../../utils'

type ActivityType = 'call' | 'email' | 'viewing' | 'contract' | 'payment' | 'new_client'

interface ActivityItem {
  id: string
  type: ActivityType
  description: string
  target: string
  time: string
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'call',
    description: 'Called',
    target: 'Ahmed Hassan about Villa in New Cairo',
    time: '25 min ago',
  },
  {
    id: '2',
    type: 'viewing',
    description: 'Completed property viewing with',
    target: 'Sara El-Masry at Zamalek Apartment',
    time: '1 hour ago',
  },
  {
    id: '3',
    type: 'contract',
    description: 'Sent contract draft to',
    target: 'Karim Mansour for Duplex in October',
    time: '2 hours ago',
  },
  {
    id: '4',
    type: 'email',
    description: 'Sent pricing details to',
    target: 'Nour Abdallah for Smart Village Office',
    time: '3 hours ago',
  },
  {
    id: '5',
    type: 'new_client',
    description: 'Added new client',
    target: 'Youssef Amin (referred by Mohamed Farid)',
    time: '4 hours ago',
  },
  {
    id: '6',
    type: 'payment',
    description: 'Received deposit from',
    target: 'Layla Ibrahim — EGP 250,000',
    time: '5 hours ago',
  },
]

const activityConfig: Record<ActivityType, { icon: typeof Phone; color: string; bg: string }> = {
  call:       { icon: Phone,          color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/30' },
  email:      { icon: Mail,           color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  viewing:    { icon: Eye,            color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  contract:   { icon: FileSignature,  color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  payment:    { icon: DollarSign,     color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
  new_client: { icon: UserPlus,       color: 'text-sky-600 dark:text-sky-400',     bg: 'bg-sky-50 dark:bg-sky-900/30' },
}

export function RecentActivities() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Recent Activities</h2>
        </div>
        <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          View all
        </button>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-4">
          {ACTIVITIES.map((activity) => {
            const config = activityConfig[activity.type]
            const Icon = config.icon

            return (
              <div key={activity.id} className="flex items-start gap-3 relative">
                <div className={cn('rounded-full p-1.5 z-10', config.bg)}>
                  <Icon size={14} className={config.color} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {activity.description}{' '}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {activity.target}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {activity.time}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
