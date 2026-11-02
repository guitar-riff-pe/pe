import type { ReactNode } from 'react'
import { Surface, Waveform } from '@shared/ui'
import type { BattleResult } from '../model/result'
import styles from './result-card.module.scss'

type ResultCardProps = {
  result: BattleResult
  totalVotes: number
  playing: boolean
  playAction: ReactNode
}

export function ResultCard({ result, totalVotes, playing, playAction }: ResultCardProps) {
  const winner = result.place === 1

  return (
    <Surface className={[styles.card, winner && styles.winner].filter(Boolean).join(' ')} padding="none" role="article" aria-label={`${result.place} место — ${result.player}`}>
      {winner ? (
        <>
          <p className={styles.rank}>1 место <span className={styles.mobileVotes}>· {result.votes} из {totalVotes} голосов</span></p>
          <h2>{result.player}</h2>
          <p className={styles.winnerMeta}><span className={styles.desktopVotes}>{result.votes} из {totalVotes} голосов · </span>{result.riff}</p>
          <Waveform bars={120} seed={4} maxHeight={58} className={[styles.waveform, playing && styles.activeWaveform].filter(Boolean).join(' ')} />
          <div className={styles.play}>{playAction}</div>
        </>
      ) : (
        <>
          <h2>{result.place} место · {result.player}</h2>
          <p className={styles.votes}>{result.votes} из {totalVotes} голосов</p>
          <div className={styles.play}>{playAction}</div>
        </>
      )}
    </Surface>
  )
}
