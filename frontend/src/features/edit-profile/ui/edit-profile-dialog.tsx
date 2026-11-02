import { useState, type FormEvent } from 'react'
import { Button, TextField } from '@shared/ui'
import styles from './edit-profile-dialog.module.scss'

type EditProfileDialogProps = {
  name: string
  handle: string
  onClose: () => void
  onSave: (name: string, handle: string) => void
}

export function EditProfileDialog({ name, handle, onClose, onSave }: EditProfileDialogProps) {
  const [draftName, setDraftName] = useState(name)
  const [draftHandle, setDraftHandle] = useState(handle.replace(/^@/, ''))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = draftName.trim()
    const cleanHandle = draftHandle.trim().replace(/^@/, '')
    if (cleanName && cleanHandle) onSave(cleanName, `@${cleanHandle}`)
  }

  return <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <form onSubmit={submit}>
        <h2 id="edit-profile-title">Редактировать профиль</h2>
        <TextField label="Имя игрока" value={draftName} onChange={(event) => setDraftName(event.target.value)} required maxLength={24} />
        <TextField label="Имя пользователя" value={draftHandle} onChange={(event) => setDraftHandle(event.target.value)} required maxLength={24} />
        <div className={styles.actions}><Button variant="secondary" onClick={onClose}>Отмена</Button><Button type="submit">Сохранить</Button></div>
      </form>
    </div>
  </div>
}
