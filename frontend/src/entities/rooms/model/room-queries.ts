import { queryOptions } from '@tanstack/react-query'
import { ApiError } from '@shared/api'
import { currentRoom, getRoom, listRooms } from '../api/rooms'

export const roomsKey = ['rooms'] as const
export const currentRoomKey = ['rooms', 'current'] as const
export const roomKey = (id: string) => ['rooms', 'detail', id] as const

export const publicRoomsOptions = queryOptions({
  queryKey: ['rooms', 'list'], queryFn: ({ signal }) => listRooms(signal), retry: false,
  refetchInterval: 5000,
})
export const currentRoomOptions = queryOptions({
  queryKey: currentRoomKey, queryFn: ({ signal }) => currentRoom(signal), retry: false,
  staleTime: 0,
})
export const roomOptions = (id: string) => queryOptions({
  queryKey: roomKey(id), queryFn: ({ signal }) => getRoom(id, signal), retry: false,
  refetchInterval: query => query.state.error instanceof ApiError && [401, 403, 404].includes(query.state.error.status) ? false : 3000,
})
