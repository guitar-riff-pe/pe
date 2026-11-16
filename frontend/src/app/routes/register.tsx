import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@pages/auth'
import { authSearch } from '@shared/lib/navigation'

export const Route = createFileRoute('/register')({
  validateSearch: authSearch,
  component: () => <AuthPage mode="sign-up" />,
})
