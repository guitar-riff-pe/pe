import { createFileRoute } from '@tanstack/react-router'
import { healthQueryOptions } from '@entities/health'

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.prefetchQuery(healthQueryOptions()),
})
