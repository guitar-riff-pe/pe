import { RecoveryForm, ResetPasswordForm, SignInForm, SignUpForm } from '@features/account-access'
import { AuthLayout } from '@widgets/auth-layout'

type AuthPageProps = { mode: 'sign-in' | 'sign-up' | 'recovery' | 'reset-password'; resetToken?: string }

export function AuthPage({ mode, resetToken }: AuthPageProps) {
  return (
    <>
      <AuthLayout centered={mode === 'recovery' || mode === 'reset-password'}>
        {mode === 'sign-in' ? <SignInForm /> : null}
        {mode === 'sign-up' ? <SignUpForm /> : null}
        {mode === 'recovery' ? <RecoveryForm /> : null}
        {mode === 'reset-password' ? <ResetPasswordForm token={resetToken} /> : null}
      </AuthLayout>
    </>
  )
}
