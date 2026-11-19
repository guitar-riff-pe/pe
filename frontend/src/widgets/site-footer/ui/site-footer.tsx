import { AppNavigation } from '@shared/ui'
import styles from './site-footer.module.scss'

export function SiteFooter() {
  return <footer className={styles.footer}>
    <div className={styles.inner}>
      <span>Riff Battle</span>
      <span>Твой звук. Твоё имя.</span>
    </div>
    <AppNavigation className={styles.mobileNav} mobile />
  </footer>
}
