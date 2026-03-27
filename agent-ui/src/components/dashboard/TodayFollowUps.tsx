import { Phone, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '../../utils'

type FollowUpType = 'call' | 'email' | 'visit'
type FollowUpStatus = 'pending' | 'done'

interface FollowUp {
  id: string
  clientName: string
  type: FollowUpType
  time: string
  property: string
  note: string
  status: FollowUpStatus
}

const FOLLOW_UPS: FollowUp[] = [
  {
    id: '1',
    clientName: 'Ahmed Hassan',
    type: 'call',
    time: '09:30 AM',
    property: 'Villa in New Cairo',
    note: 'Follow up on price negotiation',
    status: 'done',
  },
  {
    id: '2',
    clientName: 'Sara El-Masry',
    type: 'email',
    time: '11:00 AM',
    property: 'Apartment in Zamalek',
    note: 'Send updated floor plans',
    status: 'done',
  },
  {
    id: '3',
    clientName: 'Mohamed Farid',
    type: 'visit',
    time: '02:00 PM',
    property: 'Penthouse in Maadi',
    note: 'Property viewing scheduled',
    status: 'pending',
  },
  {
    id: '4',
    clientName: 'Nour Abdallah',
    type: 'call',
    time: '04:30 PM',
    property: 'Office in Smart Village',
    note: 'Discuss lease terms',
    status: 'pending',
  },
  {
    id: '5',
    clientName: 'Karim Mansour',
    type: 'email',
    time: '05:00 PM',
    property: 'Duplex in 6th of October',
    note: 'Share contract draft',
    status: 'pending',
  },
]

const typeConfig: Record<FollowUpType, { icon: typeof Phone; label: string; color: string }> = {
  call:  { icon: Phone,  label: 'Call',  color: 'text-blue-600 dark:text-blue-400' },
  email: { icon: Mail,   label: 'Email', color: 'text-amber-600 dark:text-amber-400' },
  visit: { icon: MapPin,  label: 'Visit', color: 'text-purple-600 dark:text-purple-400' },
}

export function TodayFollowUps() {
  const doneCount = FOLLOW_UPS.filter((f) => f.status === 'done').length

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Today's Follow-ups</h2>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {doneCount}/{FOLLOW_UPS.length} completed
        </span>
      </div>

      <div className="space-y-3">
        {FOLLOW_UPS.map((followUp) => {
          const config = typeConfig[followUp.type]
          const Icon = config.icon
          const isDone = followUp.status === 'done'

          return (
            <div
              key={followUp.id}
              className={cn(
                'flex items-start gap-3 rounded-lg p-3 transition-colors',
                'border border-gray-100 dark:border-gray-700',
                isDone && 'opacity-60',
              )}
            >
              <div className={cn(
                'mt-0.5 rounded-md p-1.5',
                isDone
                  ? 'bg-green-50 dark:bg-green-900/30'
                  : 'bg-gray-50 dark:bg-gray-700/50',
              )}>
                {isDone ? (
                  <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                ) : (
                  <Icon size={16} className={config.color} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    'text-sm font-medium text-gray-900 dark:text-gray-100',
                    isDone && 'line-through',
                  )}>
                    {followUp.clientName}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {followUp.time}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {followUp.property} &middot; {followUp.note}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
