import { createLazyFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@pages/auth'

export const Route = createLazyFileRoute('/register')({
  component: () => <AuthPage mode="sign-up" />,
})
