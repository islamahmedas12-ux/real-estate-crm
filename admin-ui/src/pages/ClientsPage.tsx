import { Users } from 'lucide-react'

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Users size={24} className="text-indigo-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400">Client management coming soon.</p>
    </div>
  )
}
