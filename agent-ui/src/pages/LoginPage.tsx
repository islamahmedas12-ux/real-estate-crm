import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Building, Mail, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  function validate() {
    const errs: typeof errors = {}
    if (!email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email'
    if (!password) errs.password = 'Password is required'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await login({ email, password })
      toast.success('Welcome back!')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials. Please try again.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Agent Portal</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              leftAddon={<Mail size={15} />}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
              leftAddon={<Lock size={15} />}
            />

            <Button
              type="submit"
              loading={submitting}
              className="mt-2 w-full"
              size="lg"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            Secure agent access &mdash; Real Estate CRM &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
