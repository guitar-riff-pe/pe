import { queryOptions } from '@tanstack/react-query'
import { apiGet } from '@shared/api'

interface Health { status: string; service: string }

export const healthQueryOptions = () => queryOptions({
  queryKey: ['health'],
  queryFn: ({ signal }) => apiGet<Health>('/health', signal),
})
