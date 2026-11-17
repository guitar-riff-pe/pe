import { createFileRoute } from '@tanstack/react-router'
import { ResultsPage } from '@pages/results'

export const Route = createFileRoute('/rooms_/results')({
  validateSearch: (search: Record<string, unknown>) => ({ roundId: typeof search.roundId === 'string' ? search.roundId : undefined }),
  component: ResultsRoute,
})

function ResultsRoute() { return <ResultsPage roundId={Route.useSearch().roundId} /> }
