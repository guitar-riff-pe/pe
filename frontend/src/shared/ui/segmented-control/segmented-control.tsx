import { useId } from 'react'
import styles from './segmented-control.module.scss'

export type SegmentedOption = { value: string; label: string }

type SegmentedControlProps = {
  label: string
  name?: string
  options: readonly SegmentedOption[]
  value: string
  onValueChange: (value: string) => void
  hint?: string
}

export function SegmentedControl({ label, name, options, value, onValueChange, hint }: SegmentedControlProps) {
  const id = useId()

  return (
    <fieldset className={styles.field}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label className={[styles.option, value === option.value && styles.selected].filter(Boolean).join(' ')} key={option.value}>
            <input
              className={styles.input}
              type="radio"
              name={name ?? id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onValueChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </fieldset>
  )
}
