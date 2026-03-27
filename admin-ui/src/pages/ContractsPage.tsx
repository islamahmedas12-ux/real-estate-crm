import { FileText } from 'lucide-react'

export default function ContractsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <FileText size={24} className="text-indigo-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contracts</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400">Contract management coming soon.</p>
    </div>
  )
}
