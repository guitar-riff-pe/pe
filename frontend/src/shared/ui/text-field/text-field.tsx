import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './text-field.module.scss'

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
  trailing?: ReactNode
}

export function TextField({ label, hint, error, trailing, id, className, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      <div className={styles.control}>
        <input
          {...props}
          id={inputId}
          className={[styles.input, trailing && styles.hasTrailing, error && styles.invalid].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
        />
        {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
      </div>
      {error ? <span className={styles.error} id={descriptionId}>{error}</span> : null}
      {!error && hint ? <span className={styles.hint} id={descriptionId}>{hint}</span> : null}
    </div>
  )
}
