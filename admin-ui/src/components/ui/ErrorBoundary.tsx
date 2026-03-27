import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
            <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Something went wrong
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
          <Button variant="secondary" onClick={this.handleRetry}>
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
