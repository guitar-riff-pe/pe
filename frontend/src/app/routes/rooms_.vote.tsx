import { createFileRoute } from '@tanstack/react-router'
import { VotingPage } from '@pages/voting'

export const Route = createFileRoute('/rooms_/vote')({
  validateSearch: (search: Record<string, unknown>) => ({ roundId: typeof search.roundId === 'string' ? search.roundId : undefined }),
  component: VotingRoute,
})

function VotingRoute() { return <VotingPage roundId={Route.useSearch().roundId} /> }
