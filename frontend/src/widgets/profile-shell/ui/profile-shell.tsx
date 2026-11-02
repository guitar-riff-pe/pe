import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { AppNavigation, BrandLink } from '@shared/ui'
import styles from './profile-shell.module.scss'

export function ProfileShell({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>
    <header className={styles.header}>
      <BrandLink monochrome />
      <Link className={styles.mobileLogout} to="/login">Выйти</Link>
    </header>
    <aside className={styles.sidebar} aria-label="Личный кабинет">
      <p>Играть</p>
      <nav>
        <Link to="/rooms">Публичные комнаты</Link>
        <Link to="/rooms/create">Создать комнату</Link>
        <Link className={styles.current} to="/profile" aria-current="page">Мой профиль</Link>
      </nav>
      <Link className={styles.logout} to="/login">Выйти из аккаунта</Link>
    </aside>
    <div className={styles.content}>{children}</div>
    <AppNavigation className={styles.mobileNav} mobile />
  </div>
}
