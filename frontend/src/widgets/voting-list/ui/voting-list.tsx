import { SubmissionCard, type Submission } from '@entities/submissions'
import { PlayRiffButton } from '@features/play-riff'
import { VoteForRiffAction } from '@features/vote-for-riff'
import styles from './voting-list.module.scss'

type VotingListProps = {
  submissions: readonly Submission[]
  voteId: string | null
  playingId: string | null
  onPlay: (id: string) => void
  onVote: (id: string) => void
}

export function VotingList({ submissions, voteId, playingId, onPlay, onVote }: VotingListProps) {
  return (
    <section className={styles.list} aria-label="Риффы для голосования">
      {submissions.map((submission) => {
        const voteState = submission.own ? 'own' : voteId === submission.id ? 'confirmed' : voteId ? 'locked' : 'available'
        const playing = playingId === submission.id
        return <SubmissionCard
          key={submission.id}
          submission={submission}
          playing={playing}
          selected={voteState === 'confirmed'}
          stateLabel={playing ? 'Сейчас играет' : voteState === 'confirmed' ? '✓ Твой выбор' : submission.own ? 'За себя голосовать нельзя' : 'Автор скрыт'}
          playAction={<PlayRiffButton name={submission.title} playing={playing} onPlay={() => onPlay(submission.id)} compactOnMobile />}
          voteAction={<VoteForRiffAction state={voteState} onVote={() => onVote(submission.id)} />}
        />
      })}
    </section>
  )
}
