import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import styles from './select-field.module.scss'

export type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  label: string
  options: readonly SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
  hint?: string
  error?: string
  className?: string
}

export function SelectField({
  label,
  options,
  value,
  defaultValue = '',
  onValueChange,
  placeholder = 'Выбрать',
  name,
  id,
  disabled = false,
  required = false,
  hint,
  error,
  className,
}: SelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const labelId = `${selectId}-label`
  const listId = `${selectId}-list`
  const descriptionId = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const typeaheadRef = useRef({ text: '', time: 0 })
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const selectedValue = value ?? internalValue
  const selectedIndex = options.findIndex((option) => option.value === selectedValue)
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  useEffect(() => {
    if (open) (listRef.current?.children.item(activeIndex) as HTMLElement | null)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  function openList(index = selectedIndex >= 0 ? selectedIndex : 0) {
    if (disabled || options.length === 0) return
    setActiveIndex(index)
    setOpen(true)
  }

  function choose(index: number, returnFocus = true) {
    const option = options[index]
    if (!option) return
    if (value === undefined) setInternalValue(option.value)
    onValueChange?.(option.value)
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled || options.length === 0) return
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'Tab' && open) {
      choose(activeIndex, false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) openList()
      else setActiveIndex((index) => Math.max(0, Math.min(options.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))))
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      openList(event.key === 'Home' ? 0 : options.length - 1)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) choose(activeIndex)
      else openList()
      return
    }
    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const now = Date.now()
      const previous = typeaheadRef.current
      const text = now - previous.time < 500 ? previous.text + event.key.toLocaleLowerCase() : event.key.toLocaleLowerCase()
      const search = [...text].every((character) => character === text[0]) ? text[0] : text
      typeaheadRef.current = { text: search, time: now }
      const start = open ? activeIndex + 1 : selectedIndex + 1
      const index = options.findIndex((option, offset) =>
        offset >= start && option.label.toLocaleLowerCase().startsWith(search),
      )
      const fallback = options.findIndex((option) => option.label.toLocaleLowerCase().startsWith(search))
      const match = index >= 0 ? index : fallback
      if (match >= 0) {
        event.preventDefault()
        openList(match)
      }
    }
  }

  return (
    <div ref={rootRef} className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} id={labelId} htmlFor={selectId}>{label}</label>
      <div className={styles.control}>
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined}
          aria-labelledby={`${labelId} ${selectId}`}
          aria-describedby={descriptionId}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          className={[styles.trigger, open && styles.open, error && styles.invalid].filter(Boolean).join(' ')}
          disabled={disabled}
          onClick={() => open ? setOpen(false) : openList()}
          onKeyDown={onKeyDown}
        >
          <span className={selected ? undefined : styles.placeholder}>{selected?.label ?? placeholder}</span>
          <span className={styles.chevron} aria-hidden="true" />
        </button>
        {open ? (
          <div ref={listRef} id={listId} className={styles.listbox} role="listbox" aria-labelledby={labelId}>
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={option.value === selectedValue}
                className={[styles.option, index === activeIndex && styles.active, option.value === selectedValue && styles.selected].filter(Boolean).join(' ')}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(index)}
              >
                <span>{option.label}</span>
                {option.value === selectedValue ? <span aria-hidden="true">✓</span> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      {error ? <span className={styles.error} id={descriptionId}>{error}</span> : null}
      {!error && hint ? <span className={styles.hint} id={descriptionId}>{hint}</span> : null}
    </div>
  )
}
