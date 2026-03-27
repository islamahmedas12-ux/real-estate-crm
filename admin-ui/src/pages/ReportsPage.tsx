import { BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BarChart3 size={24} className="text-indigo-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400">Analytics and reporting coming soon.</p>
    </div>
  )
}
