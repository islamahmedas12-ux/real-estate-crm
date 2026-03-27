import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Phone, Users as UsersIcon, StickyNote, X } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { cn } from '../utils'

type QuickType = 'CALL' | 'MEETING' | 'NOTE'

const QUICK_TYPES: { value: QuickType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: 'CALL', label: 'Call', icon: Phone },
  { value: 'MEETING', label: 'Meeting', icon: UsersIcon },
  { value: 'NOTE', label: 'Note', icon: StickyNote },
]

interface QuickLogActivityProps {
  /** Pre-fill entity context if logging from a detail page */
  entityType?: string
  entityId?: string
  className?: string
}

export function QuickLogActivity({ entityType, entityId, className }: QuickLogActivityProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<QuickType>('CALL')
  const [description, setDescription] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const mutation = useMutation({
    mutationFn: (payload: {
      type: string
      description: string
      entityType: string
      entityId: string
      performedBy: string
    }) => apiClient.post('/api/activities', payload).then((r) => r.data),
    onSuccess: () => {
      toast.success('Activity logged!')
      setDescription('')
      setOpen(false)
      // Invalidate activity queries so lists refresh
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
    onError: () => {
      toast.error('Failed to log activity.')
    },
  })

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error('Please enter a description.')
      return
    }
    mutation.mutate({
      type: selected,
      description: description.trim(),
      entityType: entityType ?? 'LEAD',
      entityId: entityId ?? '',
      performedBy: user?.id ?? '',
    })
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-40', className)} ref={panelRef}>
      {/* Expanded panel */}
      {open && (
        <div className="mb-3 w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Quick Log Activity
            </h4>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Type selector */}
          <div className="flex gap-2 mb-3">
            {QUICK_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSelected(value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  selected === value
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600',
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Description */}
          <Textarea
            placeholder={`Describe the ${selected.toLowerCase()}...`}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button
            className="w-full mt-3"
            size="sm"
            onClick={handleSubmit}
            loading={mutation.isPending}
          >
            Log {selected.charAt(0) + selected.slice(1).toLowerCase()}
          </Button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200',
          'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          open && 'rotate-45',
        )}
        title="Quick log activity"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
