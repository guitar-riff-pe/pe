import { queryOptions } from '@tanstack/react-query'
import { apiRequest } from '@shared/api'
import type { ProfileRecord } from '../model/profile'
import { formatProfile } from '../model/format-profile'

export const profileKey = ['profile', 'me'] as const
export const profileOptions = queryOptions({
  queryKey: profileKey,
  queryFn: async ({ signal }) => formatProfile(await apiRequest<ProfileRecord>('/profile/me', { signal })),
  staleTime: 0, retry: false,
})

export async function updateProfile(name: string, handle: string) {
  return formatProfile(await apiRequest<ProfileRecord>('/profile/me', { method: 'PATCH', body: JSON.stringify({ name, handle }) }))
}
