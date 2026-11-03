import { createFileRoute } from '@tanstack/react-router'
import { LobbyPage } from '@pages/lobby'

export const Route = createFileRoute('/rooms_/lobby')({ component: LobbyPage })
