import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../utils'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
  defaultValue?: string
}

export function SearchBar({
  onSearch,
  placeholder = 'Search…',
  debounceMs = 300,
  className,
  defaultValue = '',
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSearch(value), debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, debounceMs, onSearch])

  function handleClear() {
    setValue('')
    onSearch('')
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search
        size={16}
        className="absolute left-3 text-gray-400 pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-gray-300 bg-white text-gray-900 text-sm',
          'pl-9 pr-8 py-2 placeholder:text-gray-400',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500',
        )}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          type="button"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
