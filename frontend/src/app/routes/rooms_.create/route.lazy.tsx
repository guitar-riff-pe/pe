import { createLazyFileRoute } from '@tanstack/react-router'
import { CreateRoomPage } from '@pages/create-room'

export const Route = createLazyFileRoute('/rooms_/create')({
  component: CreateRoomPage,
})
