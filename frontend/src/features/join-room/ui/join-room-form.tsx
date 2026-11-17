import { useState, type FormEvent } from 'react'
import { validRoomCode } from '@entities/rooms'
import { Button, TextField } from '@shared/ui'
import { useJoinRoom } from '../model/use-join-room'
import { JoinRoomFeedback } from './join-room-feedback'
import styles from './join-room.module.scss'

export function JoinRoomForm({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode)
  const [validation, setValidation] = useState('')
  const join = useJoinRoom()
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (join.isPending) return
    if (!validRoomCode(code)) { setValidation('Введи код комнаты: 4–8 латинских букв или цифр.'); return }
    setValidation('')
    join.mutate(code)
  }
  return <form className={styles.form} onSubmit={submit} noValidate aria-label="Вход в комнату по коду">
    <TextField label="Код комнаты" name="roomCode" placeholder="Например, X7K2M9" maxLength={8} value={code} disabled={join.isPending}
      autoComplete="off" spellCheck={false} onChange={event => { setCode(event.target.value.toUpperCase()); setValidation(''); join.reset() }} />
    <Button type="submit" pending={join.isPending}>Войти по коду →</Button>
    <JoinRoomFeedback error={validation || join.error?.message} needsLogin={!validation && join.needsLogin} code={code} />
  </form>
}
