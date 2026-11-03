import { ResultCard, type BattleResult } from '@entities/results'
import { PlayRiffButton } from '@features/play-riff'
import styles from './results-board.module.scss'

type ResultsBoardProps = {
  results: BattleResult[]
  totalVotes: number
  playingId: string | null
  onPlay: (id: string) => void
}

export function ResultsBoard({ results, totalVotes, playingId, onPlay }: ResultsBoardProps) {
  const winner = results.find((result) => result.place === 1)
  const others = results.filter((result) => result.place !== 1)

  return (
    <section className={styles.board} aria-label="Итоги голосования">
      {winner ? <ResultCard result={winner} totalVotes={totalVotes} playing={playingId === winner.id} playAction={<PlayRiffButton name={`победный рифф ${winner.player}`} playing={playingId === winner.id} onPlay={() => onPlay(winner.id)} label="Прослушать победный рифф" mobileLabel="Прослушать рифф" />} /> : null}
      <div className={styles.others}>
        {others.map((result) => <ResultCard key={result.id} result={result} totalVotes={totalVotes} playing={playingId === result.id} playAction={<PlayRiffButton name={`рифф ${result.player}`} playing={playingId === result.id} onPlay={() => onPlay(result.id)} label="Прослушать рифф" compactOnMobile />} />)}
      </div>
    </section>
  )
}
