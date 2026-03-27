import type { DateRangePreset } from '../../types/dashboard'

interface DateRangeFilterProps {
  value: DateRangePreset
  onChange: (preset: DateRangePreset) => void
}

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'This Year', value: 'this_year' },
]

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={
            value === p.value
              ? 'rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm'
              : 'rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
          }
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
