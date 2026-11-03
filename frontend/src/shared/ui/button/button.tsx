import type { ButtonHTMLAttributes } from 'react'
import styles from './button.module.scss'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
  pending?: boolean
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  pending = false,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={[styles.button, styles[variant], fullWidth && styles.fullWidth, className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {children}
    </button>
  )
}
