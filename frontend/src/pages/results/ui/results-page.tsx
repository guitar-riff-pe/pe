import { Link } from '@tanstack/react-router'
import { useDemoRiffPlayer } from '@entities/riffs'
import { SiteHeader } from '@widgets/site-header'
import { BattleProgress } from '@widgets/battle-progress'
import { ResultsBoard } from '@widgets/results-board'
import { demoResults } from '../model/demo-results'
import styles from './results-page.module.scss'

export function ResultsPage() {
  const player = useDemoRiffPlayer()

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <BattleProgress stage={4} />
        <header className={styles.intro}>
          <h1>Вот это рифф!</h1>
          <p>4 голоса учтено · один голос от игрока</p>
        </header>
        <ResultsBoard results={demoResults} totalVotes={4} playingId={player.playingId} onPlay={(id) => void player.play(id)} />
        <div className={styles.summary}>
          <p>Твой голос: Рифф B / GuitarHero</p>
          <p>Больше голосов — победа.<br className={styles.mobileBreak} /> При равенстве — общая победа.</p>
          {player.error ? <p role="status">{player.error}</p> : null}
        </div>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} to="/rooms/create">Сыграть ещё раз <span aria-hidden="true">→</span></Link>
          <Link className={styles.secondaryAction} to="/rooms/lobby">Вернуться в комнату</Link>
        </div>
      </main>
    </>
  )
}
