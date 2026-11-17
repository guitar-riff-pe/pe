import { Surface } from '@shared/ui'
import type { RoomParticipant } from '../model/lobby'
import styles from './participant-row.module.scss'

type ParticipantRowProps = { participant: RoomParticipant }

export function ParticipantRow({ participant }: ParticipantRowProps) {
  const empty = participant.role === 'empty'
  const status = empty ? 'Свободное место' : participant.role === 'host' ? (participant.isSelf ? 'Хост · ты' : 'Хост') : participant.isSelf ? 'В комнате · ты' : 'В комнате'

  return (
    <Surface className={[styles.row, empty && styles.empty].filter(Boolean).join(' ')} padding="none" data-role={participant.role} data-self={participant.isSelf || undefined}>
      <span className={styles.avatar} aria-hidden="true">{empty ? '+' : Array.from(participant.name)[0]?.toLocaleUpperCase()}</span>
      <div className={styles.identity}>
        <span className={styles.name}>{participant.name}</span>
        <span className={styles.mobileStatus}>{status}</span>
      </div>
      <span className={styles.status}>{status}</span>
    </Surface>
  )
}
