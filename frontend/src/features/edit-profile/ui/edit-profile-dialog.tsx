import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, TextField } from '@shared/ui'
import { isValidNickname, normalizeNickname } from '@shared/lib/validation'
import styles from './edit-profile-dialog.module.scss'

type EditProfileDialogProps = {
  name: string
  handle: string
  onClose: () => void
  onSave: (name: string, handle: string) => void
  pending?: boolean
  error?: string
}

export function EditProfileDialog({ name, handle, onClose, onSave, pending, error }: EditProfileDialogProps) {
  const [draftName, setDraftName] = useState(name)
  const [draftHandle, setDraftHandle] = useState(handle.replace(/^@/, ''))
  const [validation, setValidation] = useState('')
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement
    dialog.current?.querySelector('input')?.focus()
    return () => { if (previous instanceof HTMLElement) previous.focus() }
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const cleanName = normalizeNickname(draftName)
    const cleanHandle = draftHandle.trim().replace(/^@/, '')
    if (!isValidNickname(cleanName)) { setValidation('Имя должно содержать от 2 до 24 символов без управляющих знаков.'); return }
    if (!/^[\p{L}\p{N}_]{3,24}$/u.test(cleanHandle)) { setValidation('Ник: от 3 до 24 букв, цифр или знаков подчёркивания.'); return }
    setValidation('')
    onSave(cleanName, `@${cleanHandle}`)
  }

  return <div className={styles.backdrop} onMouseDown={(event) => { if (!pending && event.target === event.currentTarget) onClose() }}>
    <div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" onKeyDown={event => {
      if (event.key === 'Escape') { if (!pending) onClose(); event.preventDefault() }
      if (event.key !== 'Tab') return
      const fields = dialog.current?.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled)')
      if (!fields?.length) return
      const first = fields[0]; const last = fields[fields.length - 1]
      if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault() }
      else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault() }
    }}>
      <form onSubmit={submit} noValidate>
        <h2 id="edit-profile-title">Редактировать профиль</h2>
        <TextField label="Имя игрока" value={draftName} onChange={(event) => setDraftName(event.target.value)} required hint="2–24 символа" disabled={pending} />
        <TextField label="Имя пользователя" value={draftHandle} onChange={(event) => setDraftHandle(event.target.value)} required hint="3–24 буквы, цифры или знака подчёркивания" disabled={pending} />
        {(validation || error) && <p role="alert">{validation || error}</p>}
        <div className={styles.actions}><Button variant="secondary" onClick={onClose} disabled={pending}>Отмена</Button><Button type="submit" pending={pending}>Сохранить</Button></div>
      </form>
    </div>
  </div>
}
