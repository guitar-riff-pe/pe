import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { LobbyRoom } from '@entities/rooms'
import { roundPath } from '@entities/rounds'
import { Button, Surface } from '@shared/ui'
import styles from './lobby-sidebar.module.scss'

type LobbySidebarProps = {
  room: LobbyRoom; onStart?: () => void; starting?: boolean; error?: string;
  stage?: 'lobby' | 'composing' | 'voting' | 'results'; roundId?: string | null
}

export function LobbySidebar({ room, onStart, starting, error, stage = 'lobby', roundId }: LobbySidebarProps) {
  const [feedback, setFeedback] = useState('')
  const count = room.participants.filter(participant => participant.role !== 'empty').length
  const isHost = room.participants.some(participant => participant.role === 'host' && participant.isSelf)
  const active = stage === 'composing' || stage === 'voting'
  const barLabel = room.bars === null ? 'Длина по общему лупу' : `${room.bars} ${room.bars === 4 ? 'такта' : 'тактов'}`

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setFeedback('Приглашение скопировано.')
    } catch {
      setFeedback('Не удалось скопировать. Выдели код комнаты вручную.')
    }
  }

  return (
    <Surface className={styles.panel} padding="none">
      <div className={styles.invite}>
        <h2>Пригласи друзей</h2>
        <p className={styles.codeLabel}>Код комнаты</p>
        <p className={styles.code}>{room.code}</p>
        <div className={styles.copyActions}>
          <Button variant="secondary" aria-label="Скопировать приглашение" onClick={() => {
            const invitation = new URL('/rooms', window.location.origin)
            invitation.searchParams.set('code', room.code)
            void copy(invitation.toString())
          }}><span className={styles.desktopText}>Скопировать приглашение</span><span className={styles.mobileText}>Копировать</span></Button>
        </div>
      </div>
      <div className={styles.round}>
        <p className={styles.settings}>{barLabel} · {room.bpm} BPM · {room.roundMinutes} минут</p>
        <p className={styles.description}>Общий барабанный луп для всех.</p>
        {active ? <p role="status">{stage === 'composing' ? 'Идёт создание риффов.' : 'Идёт голосование.'}</p>
          : <Button fullWidth disabled={!isHost || count < 3 || !onStart} pending={starting} onClick={onStart}>{stage === 'results' ? 'Начать новый раунд' : 'Начать баттл'} <span aria-hidden="true">→</span></Button>}
        {roundId && stage !== 'lobby' && <Link className={styles.continue} to={roundPath(stage)} search={{ roundId }}>{stage === 'composing' ? 'Продолжить создание риффа →' : stage === 'voting' ? 'К голосованию →' : 'Результаты раунда →'}</Link>}
        <p className={styles.hostNote}>{!isHost ? 'Раунд запускает хост комнаты.' : count < 3 ? `Для старта нужно ещё ${3 - count} ${count === 1 ? 'игрока' : 'игрок'}.` : active ? 'Все участники получили общее задание.' : 'Ты хост. Можно запускать раунд.'}</p>
      </div>
      {feedback ? <p className={styles.feedback} role="status">{feedback}</p> : null}
      {error && <p className={styles.feedback} role="alert">{error}</p>}
    </Surface>
  )
}
