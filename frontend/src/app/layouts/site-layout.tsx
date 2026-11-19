import type { ReactNode } from 'react'
import { SiteHeader } from '@widgets/site-header'
import { SiteFooter } from '@widgets/site-footer'
import styles from './site-layout.module.scss'

export function SiteLayout({ children }: { children: ReactNode }) {
  return <div className={styles.layout}>
    <SiteHeader />
    <div className={styles.content}>{children}</div>
    <SiteFooter />
  </div>
}
