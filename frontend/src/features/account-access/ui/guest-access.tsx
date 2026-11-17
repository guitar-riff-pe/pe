import { useState } from 'react'
import { Button, TextField } from '@shared/ui'
import { isValidNickname, normalizeNickname } from '@shared/lib/validation'
import { useAuthAction } from '../model/use-auth-action'
import styles from './account-access.module.scss'

export function GuestAccess() {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const action = useAuthAction()
  return (
    <div className={styles.guest}>
      <form className={styles.guestForm} onSubmit={event => {
        event.preventDefault()
        const value = normalizeNickname(nickname)
        if (!isValidNickname(value)) { setError('Ник должен быть от 2 до 24 символов.'); return }
        setError(''); void action.submit('/session/guest', { nickname: value })
      }}>
        <TextField label="Ник для гостевой игры" autoComplete="nickname" value={nickname} error={error} onChange={event => { setNickname(event.target.value); setError('') }} />
        <Button variant="secondary" type="submit" fullWidth pending={action.pending}>Продолжить гостем</Button>
        {action.error && <p className={styles.notice} role="alert">{action.error}</p>}
      </form>
      <p className={styles.guestNote}>Гости участвуют наравне со всеми.<br />Статистика доступна после входа.</p>
    </div>
  )
}
