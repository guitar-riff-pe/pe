import type { HTMLAttributes } from 'react'
import styles from './surface.module.scss'

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  padding?: 'default' | 'compact' | 'none'
}

export function Surface({ padding = 'default', className, ...props }: SurfaceProps) {
  return (
    <div
      {...props}
      className={[styles.surface, styles[padding], className].filter(Boolean).join(' ')}
    />
  )
}
