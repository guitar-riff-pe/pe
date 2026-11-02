import type { HTMLAttributes } from 'react'
import styles from './status.module.scss'

type StatusProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
}

export function Status({ tone = 'neutral', className, ...props }: StatusProps) {
  return <span {...props} className={[styles.status, styles[tone], className].filter(Boolean).join(' ')} />
}
