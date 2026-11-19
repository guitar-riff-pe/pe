import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '../error-state/error-state'

type Props = {
  children: ReactNode
  resetKey?: string
  onReset?: () => void
  onError?: (error: Error, info: ErrorInfo) => void
  fallback?: (error: unknown, reset: () => void) => ReactNode
}
type State = { failed: boolean; error: unknown }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { failed: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  componentDidUpdate(previous: Props) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.reset()
  }

  reset = () => {
    this.props.onReset?.()
    this.setState({ failed: false, error: null })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return this.props.fallback
      ? this.props.fallback(this.state.error, this.reset)
      : <ErrorState error={this.state.error} onRetry={this.reset} />
  }
}
