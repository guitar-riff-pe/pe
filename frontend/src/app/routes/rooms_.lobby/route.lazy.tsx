import { createLazyFileRoute } from '@tanstack/react-router'
import { LobbyPage } from '@pages/lobby'

export const Route = createLazyFileRoute('/rooms_/lobby')({
  component: LobbyRoute,
})

function LobbyRoute() {
  const { roomId, stay } = Route.useSearch()
  return <LobbyPage roomId={roomId} stay={stay} />
}
