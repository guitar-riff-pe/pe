import { createLazyFileRoute } from '@tanstack/react-router'
import { VotingPage } from '@pages/voting'

export const Route = createLazyFileRoute('/rooms_/vote')({
  component: VotingRoute,
})

function VotingRoute() { return <VotingPage roundId={Route.useSearch().roundId} /> }
