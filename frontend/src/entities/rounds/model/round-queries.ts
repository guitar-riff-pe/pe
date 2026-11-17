import { queryOptions } from '@tanstack/react-query'
import { ApiError } from '@shared/api'
import { getRound } from '../api/get-round'

export const roundKey = (id: string) => ['rounds', id] as const
export const roundOptions = (id: string) => queryOptions({
  queryKey: roundKey(id),
  queryFn: ({ signal }) => getRound(id, signal),
  staleTime: 0,
  retry: false,
  refetchInterval: query => query.state.data?.stage === 'results' || (query.state.error instanceof ApiError && [401, 403, 404].includes(query.state.error.status)) ? false : 2000,
})

export const roundPath = (stage: 'composing' | 'voting' | 'results') =>
  stage === 'composing' ? '/rooms/compose' : stage === 'voting' ? '/rooms/vote' : '/rooms/results'
