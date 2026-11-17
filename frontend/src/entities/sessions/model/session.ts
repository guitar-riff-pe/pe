import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import { apiRequest, ApiError } from '@shared/api'

export type SessionPlayer = { id: string; nickname: string; kind: 'guest' | 'account' }
export const sessionQueryKey = ['session'] as const
export const sessionOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: async ({ signal }): Promise<SessionPlayer | null> => {
    try { return await apiRequest<SessionPlayer>('/session/me', { signal }) }
    catch (reason) { if (reason instanceof ApiError && reason.status === 401) return null; throw reason }
  },
  staleTime: 30_000,
  retry: false,
})

export const useSession = () => useQuery(sessionOptions)

export async function updateSession(client: QueryClient, player: SessionPlayer | null) {
  await client.cancelQueries()
  client.removeQueries({ predicate: query => query.queryKey[0] !== sessionQueryKey[0] })
  client.setQueryData(sessionQueryKey, player)
}
