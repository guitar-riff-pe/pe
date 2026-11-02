import { createFileRoute } from '@tanstack/react-router'
import { CreateRoomPage } from '@pages/create-room'

export const Route = createFileRoute('/rooms_/create')({ component: CreateRoomPage })
