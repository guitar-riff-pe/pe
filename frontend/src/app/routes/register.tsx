import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@pages/auth'

export const Route = createFileRoute('/register')({
  component: () => <AuthPage mode="sign-up" />,
})
