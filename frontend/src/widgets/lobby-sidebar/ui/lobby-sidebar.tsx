import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { LobbyRoom } from '@entities/rooms'
import { Button, Surface } from '@shared/ui'
import styles from './lobby-sidebar.module.scss'

type LobbySidebarProps = { room: LobbyRoom }

export function LobbySidebar({ room }: LobbySidebarProps) {
  const [feedback, setFeedback] = useState('')
  const [showVotingDemo, setShowVotingDemo] = useState(false)

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setFeedback(label + ' скопирован')
      setShowVotingDemo(false)
    } catch {
      setFeedback('Не удалось скопировать. Выдели код комнаты вручную.')
      setShowVotingDemo(false)
    }
  }

  return (
    <Surface className={styles.panel} padding="none">
      <div className={styles.invite}>
        <h2>Пригласи друзей</h2>
        <p className={styles.codeLabel}>Код комнаты</p>
        <p className={styles.code}>{room.code}</p>
        <div className={styles.copyActions}>
          <Button variant="secondary" onClick={() => void copy(room.code, 'Демо-код')}><span className={styles.desktopText}>Копировать </span>код</Button>
          <Button variant="secondary" onClick={() => void copy(new URL('/rooms/lobby', window.location.href).toString(), 'Демо-ссылка')}><span className={styles.desktopText}>Копировать </span>ссылку</Button>
        </div>
      </div>
      <div className={styles.round}>
        <p className={styles.settings}>{room.bars} такта · {room.bpm} BPM · {room.roundMinutes} минут</p>
        <p className={styles.description}>Общее задание выдаётся при старте.</p>
        <Button fullWidth onClick={() => { setFeedback('Запуск баттла станет доступен после подключения сервера.'); setShowVotingDemo(true) }}>Начать баттл <span aria-hidden="true">→</span></Button>
        <p className={styles.hostNote}>Ты хост. Можно начать с {room.participants.filter((participant) => participant.role !== 'empty').length} игроками.</p>
      </div>
      {feedback ? <p className={styles.feedback} role="status">{feedback} {showVotingDemo ? <Link to="/rooms/vote">Открыть демо голосование →</Link> : null}</p> : null}
    </Surface>
  )
}
