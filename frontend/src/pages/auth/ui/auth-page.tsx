import { RecoveryForm, SignInForm, SignUpForm } from '@features/account-access'
import { AuthLayout } from '@widgets/auth-layout'
import { SiteHeader } from '@widgets/site-header'
import styles from './auth-page.module.scss'

type AuthPageProps = { mode: 'sign-in' | 'sign-up' | 'recovery' }

export function AuthPage({ mode }: AuthPageProps) {
  return (
    <div className={styles.shell}>
      <SiteHeader mobileNavigation={false} />
      <AuthLayout centered={mode === 'recovery'}>
        {mode === 'sign-in' ? <SignInForm /> : null}
        {mode === 'sign-up' ? <SignUpForm /> : null}
        {mode === 'recovery' ? <RecoveryForm /> : null}
      </AuthLayout>
    </div>
  )
}
