import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../../utils'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <nav aria-label="breadcrumb">
      <ol className="flex items-center gap-1 text-sm">
        <li>
          <Link
            to="/"
            className="flex items-center text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Home size={14} />
          </Link>
        </li>
        {segments.map((seg, i) => {
          const path = '/' + segments.slice(0, i + 1).join('/')
          const isLast = i === segments.length - 1

          return (
            <li key={path} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
              {isLast ? (
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {capitalize(seg)}
                </span>
              ) : (
                <Link
                  to={path}
                  className={cn(
                    'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors',
                  )}
                >
                  {capitalize(seg)}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
