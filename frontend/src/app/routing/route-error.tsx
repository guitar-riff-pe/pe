import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { ErrorState } from '@shared/ui'

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queries = useQueryErrorResetBoundary()
  const retry = () => {
    queries.reset()
    void router.invalidate().then(reset).catch(() => { reset() })
  }
  return <main><ErrorState error={error} onRetry={retry} /></main>
}
