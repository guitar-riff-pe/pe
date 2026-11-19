import { createLazyFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@pages/auth'

export const Route = createLazyFileRoute('/reset-password')({
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  return <AuthPage mode="reset-password" resetToken={Route.useSearch().token} />
}
