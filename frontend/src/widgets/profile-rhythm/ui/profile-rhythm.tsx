import { Surface } from '@shared/ui'
import styles from './profile-rhythm.module.scss'

const weekDate = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })

export function ProfileRhythm({ weeklyBattles, weekStarts = [] }: { weeklyBattles: number[]; weekStarts?: string[]; totalBattles: number }) {
  const maximum = Math.max(1, ...weeklyBattles)
  const weeks = weeklyBattles.map((_, index) => weekStarts[index] ? weekDate.format(new Date(weekStarts[index])) : String(index + 1))
  return <Surface className={styles.card} padding="none">
    <div className={styles.heading}><div><h2>Твой ритм</h2><p>Баттлы за {weeklyBattles.length} недель</p></div><strong>{weeklyBattles.reduce((sum, count) => sum + count, 0)}</strong></div>
    <div className={styles.chart} role="img" aria-label={`Баттлов по неделям: ${weeklyBattles.join(', ')}`}>
      {weeklyBattles.map((count, index) => <div className={styles.week} key={weeks[index]}>
        <span className={styles.count}>{count}</span>
        <span className={[styles.bar, index === weeklyBattles.length - 1 && styles.latest].filter(Boolean).join(' ')} style={{ height: `${count / maximum * 100}%` }} />
        <span className={styles.label}>{weeks[index]}</span>
      </div>)}
    </div>
  </Surface>
}
