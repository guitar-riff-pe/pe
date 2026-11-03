import { Link } from '@tanstack/react-router'
import styles from './app-navigation.module.scss'

export function AppNavigation({ mobile = false, className }: { mobile?: boolean; className?: string }) {
  return <nav className={[styles.navigation, mobile && styles.mobile, className].filter(Boolean).join(' ')} aria-label={mobile ? 'Навигация для мобильного экрана' : 'Основная навигация'}>
    <Link to="/" activeProps={{ 'aria-current': 'page' }}>Играть</Link>
    <Link to="/rooms" activeProps={{ 'aria-current': 'page' }}>Комнаты</Link>
    <Link to="/profile" activeProps={{ 'aria-current': 'page' }}>Профиль</Link>
  </nav>
}
