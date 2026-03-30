import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authme } from '../lib/authme'

/**
 * OAuth2 / OIDC callback handler.
 * AuthMe redirects here after the user authenticates.
 * The SDK exchanges the authorization code for tokens and restores the session.
 */
export default function CallbackPage() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    async function handleCallback() {
      try {
        const success = await authme.handleCallback()
        if (success) {
          navigate('/', { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
      } catch {
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Signing you in…</p>
      </div>
    </div>
  )
}
