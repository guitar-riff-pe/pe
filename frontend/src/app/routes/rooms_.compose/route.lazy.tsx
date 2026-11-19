import { createLazyFileRoute } from '@tanstack/react-router'
import { CreateRiffPage } from '@pages/create-riff'

export const Route = createLazyFileRoute('/rooms_/compose')({
  component: ComposeRoute,
})

function ComposeRoute() {
  const { roundId } = Route.useSearch()
  return <CreateRiffPage roundId={roundId} />
}
