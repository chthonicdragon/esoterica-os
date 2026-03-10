import React from 'react'

interface RouteErrorBoundaryProps {
  children: React.ReactNode
  fallback: (api: { error: Error | null; reset: () => void }) => React.ReactNode
}

interface RouteErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class RouteErrorBoundary extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('Route crashed:', error)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback({ error: this.state.error, reset: this.reset })
    }

    return this.props.children
  }
}
