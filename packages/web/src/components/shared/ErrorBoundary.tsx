import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex h-full flex-col items-center justify-center gap-3 py-16">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Something went wrong.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors"
            style={{ background: 'var(--primary-ghost)', color: 'var(--primary-text)' }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
