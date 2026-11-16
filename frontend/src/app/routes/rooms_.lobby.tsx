import { createFileRoute } from '@tanstack/react-router'
import { LobbyPage } from '@pages/lobby'

export const Route = createFileRoute('/rooms_/lobby')({
  validateSearch: (search: Record<string, unknown>): { roomId?: string; stay?: boolean } => ({
    roomId: typeof search.roomId === 'string' && search.roomId ? search.roomId : undefined,
    stay: search.stay === true || search.stay === 'true' ? true : undefined,
  }),
  component: LobbyRoute,
})

function LobbyRoute() {
  const { roomId, stay } = Route.useSearch()
  return <LobbyPage roomId={roomId} stay={stay} />
}
