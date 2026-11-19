import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rooms_/results')({
  validateSearch: (search: Record<string, unknown>) => ({ roundId: typeof search.roundId === 'string' ? search.roundId : undefined }),
})
