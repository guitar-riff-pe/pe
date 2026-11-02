import { Surface, Waveform } from '@shared/ui'
import type { BestRound } from '../model/profile'
import styles from './best-round-card.module.scss'

export function BestRoundCard({ round }: { round: BestRound }) {
  return <Surface className={styles.card} padding="none">
    <span>Лучший раунд</span><h2>{round.title}</h2><p>{round.place} место · {round.votes} голосов · {round.date}</p>
    <Waveform bars={90} seed={3} maxHeight={52} className={styles.waveform} />
  </Surface>
}
