import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { currentRoomKey, joinRoom, normalizeRoomCode, roomKey, roomsKey } from '@entities/rooms'
import { ApiError } from '@shared/api'

export function useJoinRoom() {
  const queries = useQueryClient()
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: (code: string) => joinRoom(normalizeRoomCode(code)),
    onSuccess: async room => {
      await queries.cancelQueries({ queryKey: roomsKey })
      void queries.invalidateQueries({ queryKey: roomsKey, refetchType: 'none' })
      queries.setQueryData(roomKey(room.id), room)
      queries.setQueryData(currentRoomKey, room)
      await navigate({ to: '/rooms/lobby', search: { roomId: room.id } })
    },
  })
  return {
    ...mutation,
    needsLogin: mutation.error instanceof ApiError && mutation.error.status === 401,
  }
}
