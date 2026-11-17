import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createRoom, currentRoomKey, roomKey, roomsKey } from '@entities/rooms'
import { ApiError } from '@shared/api'
import { Button, SegmentedControl, SelectField, TextField } from '@shared/ui'
import { playerOptions, riffLengthOptions, validateRoomName, visibilityOptions, type RiffLength, type RoomVisibility } from '../model/room-draft'
import styles from './create-room-form.module.scss'

export function CreateRoomForm() {
  const navigate = useNavigate()
  const queries = useQueryClient()
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<RoomVisibility>('public')
  const [players, setPlayers] = useState('4')
  const [riffLength, setRiffLength] = useState<RiffLength>('4')
  const [submitted, setSubmitted] = useState(false)
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const nameError = submitted ? validateRoomName(name) : undefined

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setSubmitted(true)
    if (validateRoomName(name)) {
      setNotice('')
      return
    }
    setPending(true); setNotice(''); setNeedsLogin(false)
    try {
      const room = await createRoom({ name: name.trim(), visibility, capacity: Number(players), bars: Number(riffLength) as 4 | 8 })
      await queries.cancelQueries({ queryKey: roomsKey })
      void queries.invalidateQueries({ queryKey: roomsKey, refetchType: 'none' })
      queries.setQueryData(roomKey(room.id), room)
      queries.setQueryData(currentRoomKey, room)
      await navigate({ to: '/rooms/lobby', search: { roomId: room.id } })
    } catch (reason) {
      setNeedsLogin(reason instanceof ApiError && reason.status === 401)
      setNotice(reason instanceof Error ? reason.message : 'Не удалось создать комнату.')
    } finally { setPending(false) }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Название комнаты"
        name="roomName"
        placeholder="Midnight Garage"
        value={name}
        disabled={pending}
        onChange={(event) => setName(event.target.value)}
        maxLength={40}
        error={nameError}
      />
      <SegmentedControl
        label="Видимость"
        name="visibility"
        disabled={pending}
        options={visibilityOptions}
        value={visibility}
        onValueChange={(value) => setVisibility(value as RoomVisibility)}
        hint={visibility === 'public' ? 'Публичная комната появится в общем списке.' : 'В приватную комнату можно войти по приглашению.'}
      />
      <SelectField
        label="Количество игроков"
        name="capacity"
        disabled={pending}
        options={playerOptions}
        value={players}
        onValueChange={setPlayers}
      />
      <SegmentedControl
        label="Длина риффа"
        name="riffLength"
        disabled={pending}
        options={riffLengthOptions}
        value={riffLength}
        onValueChange={(value) => setRiffLength(value as RiffLength)}
      />
      <Button className={styles.submit} type="submit" fullWidth pending={pending}>Создать и перейти в лобби <span aria-hidden="true">→</span></Button>
      {notice ? <p className={styles.notice} role="alert">{notice} {needsLogin && <Link to="/login" search={{ redirect: '/rooms/create' }}>Войти или продолжить гостем →</Link>}</p> : null}
      <p className={styles.mobileNote}>На сочинение — 5 минут.<br />Барабанный луп общий для всех.</p>
    </form>
  )
}
