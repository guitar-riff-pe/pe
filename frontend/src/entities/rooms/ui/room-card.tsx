import type { ReactNode } from 'react'
import { Status, Surface } from '@shared/ui'
import type { Room } from '../model/room'
import styles from './room-card.module.scss'

type RoomCardProps = { room: Room; action?: ReactNode }

export function RoomCard({ room, action }: RoomCardProps) {
  const isWaiting = room.status === 'waiting'

  return (
    <Surface className={styles.card} padding="compact" role="article" aria-label={`Комната ${room.name}`}>
      <div className={styles.identity}>
        <span className={styles.icon} aria-hidden="true">♪</span>
        <h2 className={styles.name}>{room.name}</h2>
      </div>
      <p className={styles.meta}>{room.style} · {room.bpm} BPM</p>
      <p className={styles.players}>{room.players} / {room.capacity} игроков</p>
      <Status className={styles.status} tone={isWaiting ? 'accent' : 'neutral'}>
        {isWaiting ? 'Ожидание' : 'Раунд идёт'}
      </Status>
      {action ? <div className={styles.action}>{action}</div> : null}
    </Surface>
  )
}
