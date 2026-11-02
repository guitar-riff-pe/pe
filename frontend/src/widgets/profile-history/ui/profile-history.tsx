import { BattleRow, type ProfileBattle } from '@entities/profiles'
import styles from './profile-history.module.scss'

type ProfileHistoryProps = { battles: ProfileBattle[]; expanded: boolean; onToggle: () => void }

export function ProfileHistory({ battles, expanded, onToggle }: ProfileHistoryProps) {
  const title = expanded ? 'История баттлов' : 'Последние баттлы'
  return <section className={styles.history} aria-label={title}>
    <h2>{title}</h2>
    <div className={styles.battles} role="list">{(expanded ? battles : battles.slice(0, 2)).map((battle) => <BattleRow key={battle.id} battle={battle} />)}</div>
    <button className={styles.action} type="button" onClick={onToggle}>{expanded ? 'К обзору' : 'Вся история'} <span aria-hidden="true">→</span></button>
  </section>
}
