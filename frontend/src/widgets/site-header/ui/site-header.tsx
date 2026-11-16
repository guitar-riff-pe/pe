import { Link, useLocation } from '@tanstack/react-router'
import { safeReturnTo } from '@shared/lib/navigation'
import { AppNavigation, BrandLink } from '@shared/ui'
import { useSession } from '@entities/sessions'
import { SignOutButton } from '@features/sign-out'
import styles from './site-header.module.scss'

export function SiteHeader({ mobileNavigation = true }: { mobileNavigation?: boolean }) {
  const { data: player } = useSession()
  const href = useLocation({ select: location => location.href })
  const loginSearch = { redirect: safeReturnTo(href) }
  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <BrandLink />
          <AppNavigation className={styles.nav} />
          {player ? <div className={styles.session}><Link to="/profile">{player.nickname}</Link><SignOutButton /></div> : <>
            <Link className={styles.account} to="/login" search={loginSearch}>Войти / Регистрация</Link>
            {!mobileNavigation ? <Link className={styles.mobileAccount} to="/login" search={loginSearch}>Войти</Link> : null}
          </>}
        </div>
      </header>
      {mobileNavigation ? <AppNavigation className={styles.mobileNav} mobile /> : null}
    </>
  )
}
