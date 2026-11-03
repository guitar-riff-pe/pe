import { Surface } from '@shared/ui'
import type { RoomParticipant } from '../model/lobby'
import styles from './participant-row.module.scss'

type ParticipantRowProps = { participant: RoomParticipant }

export function ParticipantRow({ participant }: ParticipantRowProps) {
  const empty = participant.role === 'empty'
  const status = empty ? 'Можно присоединиться' : participant.role === 'host' ? (participant.isSelf ? 'Хост · ты' : 'Хост') : 'Подключён'

  return (
    <Surface className={styles.row} padding="none">
      <span className={styles.avatar} aria-hidden="true">{empty ? '+' : participant.name.charAt(0).toLocaleUpperCase()}</span>
      <div className={styles.identity}>
        <span className={styles.name}>{participant.name}</span>
        <span className={styles.mobileStatus}>{status}</span>
      </div>
      <span className={styles.status}>{status}</span>
    </Surface>
  )
}
