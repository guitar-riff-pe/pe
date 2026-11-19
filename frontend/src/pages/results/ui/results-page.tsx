import { useStartRound } from '@features/start-round'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { roomOptions } from '@entities/rooms'
import { roundPath, type RoundData } from '@entities/rounds'
import { useSession } from '@entities/sessions'
import { useRoundSession, RoundSessionStatus, RoundConnectionStatus } from '@features/follow-round'
import { useRoundPlayer } from '@features/play-riff'
import { Button, Surface } from '@shared/ui'
import { BattleProgress } from '@widgets/battle-progress'
import { ResultsBoard } from '@widgets/results-board'
import { rankRiffs } from '../model/rank-riffs'
import styles from './results-page.module.scss'

export function ResultsPage({ roundId }: { roundId?: string }) {
  const state = useRoundSession(roundId, 'results')
  return <main className={styles.page}><BattleProgress stage={4} />
    {state.round && <RoundConnectionStatus state={state} />}
    {state.round ? <LiveResults key={state.round.id} round={state.round} /> :
      <RoundSessionStatus state={state} returnTo={`/rooms/results${roundId ? `?roundId=${encodeURIComponent(roundId)}` : ''}`} />}
  </main>
}

function LiveResults({ round }: { round: RoundData }) {
  const player = useRoundPlayer(round)
  const session = useSession()
  const room = useQuery(roomOptions(round.room_id))
  const navigate = useNavigate()
  const observedCurrent = useRef(false)
  const current = room.data
  useEffect(() => {
    if (!current) return
    if (current.current_round_id === round.id) observedCurrent.current = true
    else if (observedCurrent.current && current.current_round_id && current.stage !== 'lobby') {
      void navigate({ to: roundPath(current.stage), search: { roundId: current.current_round_id }, replace: true })
    }
  }, [current, round.id, navigate])
  const start = useStartRound(round.room_id)
  const results = useMemo(() => rankRiffs(round.riffs ?? []), [round.riffs])
  const chosen = results.find(item => item.id === round.your_vote_riff_id)
  const isHost = current?.host_id === session.data?.id
  const latest = current?.current_round_id === round.id
  return <>
    <header className={styles.intro}><h1>{results.length ? 'Вот это рифф!' : 'Раунд завершён'}</h1>
      <p>Учтено голосов: {round.votes_count} · один голос от игрока</p>
    </header>
    {results.length ? <ResultsBoard results={results} totalVotes={round.votes_count} playingId={player.playingId} onPlay={player.play} /> :
      <Surface><p>Никто не отправил рифф. Можно попробовать ещё раз.</p></Surface>}
    <div className={styles.summary}>
      <p>{chosen ? `Твой голос: ${chosen.riff} / ${chosen.player}` : 'Ты не голосовал в этом раунде.'}</p>
      <p>Больше голосов — победа. При равенстве — общая победа.</p>
      {player.loading && <p role="status">Загружаем звук…</p>}
      {player.error && <p role="alert">{player.error}</p>}
      {start.error && <p role="alert">{start.error.message}</p>}
      {current && latest && !isHost && <p>Новый раунд запускает хост комнаты.</p>}
      {current && latest && current.members.length < 3 && <p>Для нового раунда нужны минимум три игрока.</p>}
      {room.isError && <p>Комната недоступна. Результаты раунда сохранены.</p>}
    </div>
    <div className={styles.actions}>
      {current && latest && isHost && <Button pending={start.isPending} disabled={current.members.length < 3} onClick={() => start.mutate()}>Сыграть ещё раз →</Button>}
      {current?.current_round_id && !latest && current.stage !== 'lobby' &&
        <Link className={styles.primaryAction} to={roundPath(current.stage)} search={{ roundId: current.current_round_id }}>Открыть текущий раунд →</Link>}
      {current ? <Link className={styles.secondaryAction} to="/rooms/lobby" search={{ roomId: round.room_id, stay: true }}>Вернуться в комнату</Link> :
        <Link className={styles.secondaryAction} to="/rooms">К списку комнат →</Link>}
    </div>
  </>
}
