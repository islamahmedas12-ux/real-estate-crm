import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DuplicateMatch } from '../../types/client'

interface DuplicateWarningProps {
  matches: DuplicateMatch[]
  className?: string
}

const fieldLabel: Record<string, string> = {
  phone: 'Phone',
  email: 'Email',
  nationalId: 'National ID',
}

export default function DuplicateWarning({ matches, className = '' }: DuplicateWarningProps) {
  if (matches.length === 0) return null

  return (
    <div
      className={`rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Potential Duplicate{matches.length > 1 ? 's' : ''} Detected
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            {matches.length === 1
              ? 'A client with matching information already exists.'
              : `${matches.length} clients with matching information found.`}
          </p>
          <ul className="mt-3 space-y-2">
            {matches.map((match) => (
              <li
                key={match.id}
                className="flex items-center justify-between rounded-md bg-white/60 dark:bg-gray-800/40 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {match.firstName} {match.lastName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Matched on: {match.matchedOn.map((f) => fieldLabel[f] ?? f).join(', ')}
                  </span>
                </div>
                <Link
                  to={`/clients/${match.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                  target="_blank"
                >
                  View <ExternalLink size={12} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
