import { Link } from '@tanstack/react-router'
import styles from './brand-link.module.scss'

export function BrandLink({ monochrome = false, className }: { monochrome?: boolean; className?: string }) {
  return <Link className={[styles.brand, monochrome && styles.monochrome, className].filter(Boolean).join(' ')} to="/" aria-label="Riff Battle — главная">
    RIFF <span>/ BATTLE</span>
  </Link>
}
