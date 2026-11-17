import { createFileRoute } from '@tanstack/react-router'
import { CreateRiffPage } from '@pages/create-riff'

export const Route = createFileRoute('/rooms_/compose')({
  validateSearch: (search: Record<string, unknown>): { roundId?: string } => ({
    roundId: typeof search.roundId === 'string' && search.roundId ? search.roundId : undefined,
  }),
  head: () => ({ meta: [{ title: 'Создание риффа — Riff Battle' }] }),
  component: ComposeRoute,
})

function ComposeRoute() {
  const { roundId } = Route.useSearch()
  return <CreateRiffPage roundId={roundId} />
}
