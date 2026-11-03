import { Surface } from '@shared/ui'
import type { PlayerProfile } from '../model/profile'
import styles from './profile-stats.module.scss'

export function ProfileStats({ profile }: { profile: PlayerProfile }) {
  const stats = [
    { value: profile.battles, label: 'Баттлов сыграно', mobileLabel: 'Баттлов' },
    { value: profile.wins, label: 'Побед', mobileLabel: 'Побед', highlight: true },
    { value: `${Math.round(profile.wins / Math.max(profile.battles, 1) * 100)}%`, label: 'Доля побед', mobileLabel: 'Доля побед' },
    { value: profile.votes, label: 'Голоса за твои риффы', mobileLabel: 'Голоса' },
  ]

  return <section className={styles.grid} aria-label="Статистика игрока">
    {stats.map((stat) => <Surface className={styles.card} key={stat.label} padding="none">
      <strong className={stat.highlight ? styles.highlight : undefined}>{stat.value}</strong>
      <span className={styles.desktopLabel}>{stat.label}</span><span className={styles.mobileLabel}>{stat.mobileLabel}</span>
    </Surface>)}
  </section>
}
