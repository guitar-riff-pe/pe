import { createLazyFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@pages/auth'

export const Route = createLazyFileRoute('/forgot-password')({
  component: () => <AuthPage mode="recovery" />,
})
