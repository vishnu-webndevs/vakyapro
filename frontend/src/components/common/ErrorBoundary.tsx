import type { ReactNode } from 'react'
import { Component } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {}

  reset() {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[40vh] items-center justify-center bg-slate-950 px-4">
          <div className="max-w-md rounded-2xl border border-rose-700/60 bg-gradient-to-b from-slate-900 via-slate-950 to-black px-6 py-5 text-center shadow-lg shadow-rose-900/40">
            <h1 className="text-lg font-semibold text-rose-100">Something went wrong</h1>
            <p className="mt-2 text-sm text-rose-200/80">
              The admin interface encountered an unexpected error. Try refreshing the page.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

