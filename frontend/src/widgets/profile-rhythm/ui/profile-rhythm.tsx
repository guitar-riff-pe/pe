import { Surface } from '@shared/ui'
import styles from './profile-rhythm.module.scss'

const weeks = ['01.09', '08.09', '15.09', '22.09', '29.09', '06.10', '13.10', '20.10']

export function ProfileRhythm({ weeklyBattles, totalBattles }: { weeklyBattles: number[]; totalBattles: number }) {
  return <Surface className={styles.card} padding="none">
    <div className={styles.heading}><div><h2>Твой ритм</h2><p>Баттлы за 8 недель</p></div><strong>{totalBattles}</strong></div>
    <div className={styles.chart} role="img" aria-label={`Баттлов по неделям: ${weeklyBattles.join(', ')}`}>
      {weeklyBattles.map((count, index) => <div className={styles.week} key={weeks[index]}>
        <span className={styles.count}>{count}</span>
        <span className={[styles.bar, index === weeklyBattles.length - 1 && styles.latest].filter(Boolean).join(' ')} style={{ height: `${Math.max(10, count / Math.max(...weeklyBattles) * 100)}%` }} />
        <span className={styles.label}>{weeks[index]}</span>
      </div>)}
    </div>
    <div className={styles.months}><span>Сентябрь</span><span>Октябрь</span></div>
  </Surface>
}
