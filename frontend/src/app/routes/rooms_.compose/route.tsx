import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rooms_/compose')({
  validateSearch: (search: Record<string, unknown>): { roundId?: string } => ({
    roundId: typeof search.roundId === 'string' && search.roundId ? search.roundId : undefined,
  }),
  head: () => ({ meta: [{ title: 'Создание риффа — Riff Battle' }] }),
})
