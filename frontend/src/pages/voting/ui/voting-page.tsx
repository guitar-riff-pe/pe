import { Link } from '@tanstack/react-router'
import { useDemoVoting } from '@features/vote-for-riff'
import { SiteHeader } from '@widgets/site-header'
import { BattleProgress } from '@widgets/battle-progress'
import { VotingList } from '@widgets/voting-list'
import { demoSubmissions } from '../model/demo-submissions'
import styles from './voting-page.module.scss'

type VotingPageProps = { initialVote?: string | null }

export function VotingPage({ initialVote = 'b' }: VotingPageProps) {
  const voting = useDemoVoting(initialVote)

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <BattleProgress stage={3} />
        <header className={styles.intro}>
          <h1>Слушай. Выбирай.</h1>
          <p>Один голос за чужой рифф. Авторы пока скрыты.</p>
          <strong>Голоса: {voting.votesCount} из 4{voting.voteId ? ' · твой голос подтверждён за ' + voting.voteId.toUpperCase() : ' · выбери лучший рифф'}</strong>
        </header>
        <VotingList
          submissions={demoSubmissions}
          voteId={voting.voteId}
          playingId={voting.playingId}
          onPlay={(id) => void voting.play(id)}
          onVote={voting.vote}
        />
        <footer className={styles.footer}>
          <p>Итоги появятся после голосования всех игроков.</p>
          <p>Демо-фрагменты для прослушивания. Подтверждённый голос изменить нельзя.</p>
          {voting.message ? <p role="status">{voting.message}</p> : null}
          {voting.voteId ? <Link to="/rooms/results">Посмотреть демо результатов →</Link> : null}
        </footer>
      </main>
    </>
  )
}
