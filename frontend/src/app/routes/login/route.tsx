import { createFileRoute } from '@tanstack/react-router'
import { authSearch } from '@shared/lib/navigation'

export const Route = createFileRoute('/login')({
  validateSearch: authSearch,
})
