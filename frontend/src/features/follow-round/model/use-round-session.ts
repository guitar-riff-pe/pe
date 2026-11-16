import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { currentRoomOptions } from '@entities/rooms'
import { roundOptions, roundPath, type RoundData } from '@entities/rounds'
import { useSession } from '@entities/sessions'

export function useRoundSession(roundId: string | undefined, stage: RoundData['stage']) {
  const session = useSession()
  const navigate = useNavigate()
  const current = useQuery({ ...currentRoomOptions, enabled: !roundId && !!session.data })
  const id = roundId ?? current.data?.current_round_id ?? undefined
  const query = useQuery({ ...roundOptions(id ?? ''), enabled: !!id && !!session.data })
  const round = query.data
  useEffect(() => {
    if (!round) return
    if (round.stage !== stage || !roundId) {
      void navigate({ to: roundPath(round.stage), search: { roundId: round.id }, replace: true })
    }
  }, [round, roundId, stage, navigate])
  return {
    ...query, round: round?.stage === stage ? round : undefined, session,
    loading: session.isPending || (!!session.data && (!roundId && current.isPending || !!id && query.isPending)),
    error: query.error ?? current.error ?? session.error,
    retry: () => { void session.refetch(); if (id) void query.refetch(); else void current.refetch() },
  }
}
