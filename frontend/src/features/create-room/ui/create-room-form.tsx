import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, SegmentedControl, SelectField, TextField } from '@shared/ui'
import { playerOptions, riffLengthOptions, validateRoomName, visibilityOptions, type RiffLength, type RoomVisibility } from '../model/room-draft'
import styles from './create-room-form.module.scss'

export function CreateRoomForm() {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<RoomVisibility>('public')
  const [players, setPlayers] = useState('4')
  const [riffLength, setRiffLength] = useState<RiffLength>('4')
  const [submitted, setSubmitted] = useState(false)
  const [notice, setNotice] = useState('')
  const nameError = submitted ? validateRoomName(name) : undefined

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (validateRoomName(name)) {
      setNotice('')
      return
    }
    setNotice('Создание комнаты станет доступно после подключения сервера.')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Название комнаты"
        name="roomName"
        placeholder="Midnight Garage"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={40}
        error={nameError}
      />
      <SegmentedControl
        label="Видимость"
        name="visibility"
        options={visibilityOptions}
        value={visibility}
        onValueChange={(value) => setVisibility(value as RoomVisibility)}
        hint={visibility === 'public' ? 'Публичная комната появится в общем списке.' : 'В приватную комнату можно войти по приглашению.'}
      />
      <SelectField
        label="Количество игроков"
        name="capacity"
        options={playerOptions}
        value={players}
        onValueChange={setPlayers}
      />
      <SegmentedControl
        label="Длина риффа"
        name="riffLength"
        options={riffLengthOptions}
        value={riffLength}
        onValueChange={(value) => setRiffLength(value as RiffLength)}
      />
      <Button className={styles.submit} type="submit" fullWidth>Создать и перейти в лобби <span aria-hidden="true">→</span></Button>
      {notice ? <p className={styles.notice} role="status">{notice} <Link to="/rooms/lobby">Открыть демо лобби →</Link></p> : null}
      <p className={styles.mobileNote}>На сочинение — 5 минут.<br />Барабанный луп общий для всех.</p>
    </form>
  )
}
