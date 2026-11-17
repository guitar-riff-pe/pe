import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@pages/auth'

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  return <AuthPage mode="reset-password" resetToken={Route.useSearch().token} />
}
