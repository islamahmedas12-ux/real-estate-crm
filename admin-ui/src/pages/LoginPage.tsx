import { Navigate } from 'react-router-dom'
import { Building } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white">
              <Building size={24} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Estate CRM</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Admin Portal</p>
            </div>
          </div>

          <Button
            type="button"
            className="mt-2 w-full"
            size="lg"
            onClick={() => login()}
            loading={isLoading}
          >
            Sign in with AuthMe
          </Button>

          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            Secure admin access &mdash; Real Estate CRM &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
