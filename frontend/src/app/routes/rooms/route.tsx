import { createFileRoute } from '@tanstack/react-router'
import { parseRoomSearch } from '@features/filter-rooms'

export const Route = createFileRoute('/rooms')({
  validateSearch: parseRoomSearch,
})
