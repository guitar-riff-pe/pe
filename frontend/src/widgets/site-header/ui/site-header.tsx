import { Link } from '@tanstack/react-router'
import { AppNavigation, BrandLink } from '@shared/ui'
import styles from './site-header.module.scss'

export function SiteHeader({ mobileNavigation = true }: { mobileNavigation?: boolean }) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <BrandLink />
          <AppNavigation className={styles.nav} />
          <Link className={styles.account} to="/login">Войти / Регистрация</Link>
          {!mobileNavigation ? <Link className={styles.mobileAccount} to="/login">Войти</Link> : null}
        </div>
      </header>
      {mobileNavigation ? <AppNavigation className={styles.mobileNav} mobile /> : null}
    </>
  )
}
