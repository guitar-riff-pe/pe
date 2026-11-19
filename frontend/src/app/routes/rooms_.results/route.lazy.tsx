import { createLazyFileRoute } from '@tanstack/react-router'
import { ResultsPage } from '@pages/results'

export const Route = createLazyFileRoute('/rooms_/results')({
  component: ResultsRoute,
})

function ResultsRoute() { return <ResultsPage roundId={Route.useSearch().roundId} /> }
