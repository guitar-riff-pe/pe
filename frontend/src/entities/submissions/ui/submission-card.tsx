import type { ReactNode } from 'react'
import { Surface, Waveform } from '@shared/ui'
import type { Submission } from '../model/submission'
import styles from './submission-card.module.scss'

type SubmissionCardProps = {
  submission: Submission
  playing: boolean
  selected: boolean
  stateLabel: string
  playAction: ReactNode
  voteAction?: ReactNode
}

export function SubmissionCard({ submission, playing, selected, stateLabel, playAction, voteAction }: SubmissionCardProps) {
  return (
    <Surface className={[styles.card, selected && styles.selected, submission.own && styles.ownCard].filter(Boolean).join(' ')} padding="none" role="article" aria-label={submission.title}>
      <h2>{submission.title}</h2>
      <div className={styles.play}>{playAction}</div>
      <Waveform bars={90} seed={submission.seed} maxHeight={40} className={[styles.waveform, playing && styles.activeWaveform].filter(Boolean).join(' ')} />
      <p className={styles.state}>{stateLabel}</p>
      {voteAction ? <div className={styles.vote}>{voteAction}</div> : null}
    </Surface>
  )
}
