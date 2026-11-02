import { Surface } from '@shared/ui'
import type { ProfileBattle } from '../model/profile'
import styles from './battle-row.module.scss'

export function BattleRow({ battle }: { battle: ProfileBattle }) {
  return <Surface className={styles.row} padding="none" role="listitem">
    <strong>{battle.title}</strong>
    <span className={styles.date}>{battle.date}</span>
    <span className={battle.place === 1 ? styles.win : undefined}>{battle.place} место</span>
    <span className={styles.votes}>{battle.votes} {battle.votes === 1 ? 'голос' : battle.votes < 5 ? 'голоса' : 'голосов'}</span>
  </Surface>
}
