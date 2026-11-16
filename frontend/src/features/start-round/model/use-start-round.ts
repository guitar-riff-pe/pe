import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { roomsKey, startRoomRound } from '@entities/rooms'

export function useStartRound(roomId: string | undefined) {
  const queries = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => {
      if (!roomId) throw new Error('Комната недоступна.')
      return startRoomRound(roomId)
    },
    onSuccess: async round => {
      await queries.invalidateQueries({ queryKey: roomsKey, refetchType: 'none' })
      await navigate({ to: '/rooms/compose', search: { roundId: round.id }, replace: true })
    },
  })
}
