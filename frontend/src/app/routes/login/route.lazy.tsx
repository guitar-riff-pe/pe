import { createLazyFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@pages/auth'

export const Route = createLazyFileRoute('/login')({
  component: () => <AuthPage mode="sign-in" />,
})
