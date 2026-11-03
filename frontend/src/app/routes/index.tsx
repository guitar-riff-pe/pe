import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@pages/home'
import { healthQueryOptions } from '@entities/health'

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.prefetchQuery(healthQueryOptions()),
  component: HomePage,
})
