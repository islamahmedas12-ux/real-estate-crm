import { UserCog } from 'lucide-react'

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <UserCog size={24} className="text-indigo-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agents</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400">Agent management coming soon.</p>
    </div>
  )
}
