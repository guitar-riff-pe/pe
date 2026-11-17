import { useCallback, useMemo, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { Submission } from '@entities/submissions'
import { castVote, roundKey, type RoundData } from '@entities/rounds'
import { useRoundSession, RoundSessionStatus, RoundConnectionStatus } from '@features/follow-round'
import { useRoundPlayer } from '@features/play-riff'
import { countdownLabel, useServerDeadline } from '@shared/lib/countdown'
import { Countdown, Surface } from '@shared/ui'
import { SiteHeader } from '@widgets/site-header'
import { BattleProgress } from '@widgets/battle-progress'
import { VotingList } from '@widgets/voting-list'
import styles from './voting-page.module.scss'

export function VotingPage({ roundId }: { roundId?: string }) {
  const state = useRoundSession(roundId, 'voting')
  return <><SiteHeader /><main className={styles.page}><BattleProgress stage={3} />
    {state.round && <RoundConnectionStatus state={state} />}
    {state.round ? <LiveVoting key={state.round.id} round={state.round} /> :
      <RoundSessionStatus state={state} returnTo={`/rooms/vote${roundId ? `?roundId=${encodeURIComponent(roundId)}` : ''}`} />}
  </main></>
}

function LiveVoting({ round }: { round: RoundData }) {
  const queries = useQueryClient()
  const player = useRoundPlayer(round)
  const { expired, getSeconds } = useServerDeadline(round.voting_ends_at, round.server_now)
  const submissions = useMemo(() => (round.riffs ?? []).map((riff, index) => ({
    id: riff.id, title: `Рифф ${String.fromCharCode(65 + index)}`, seed: index + 1, own: riff.is_own,
  })), [round.riffs])
  const vote = useMutation({
    mutationFn: (id: string) => castVote(round.id, id),
    onSuccess: async result => {
      await queries.cancelQueries({ queryKey: roundKey(round.id) })
      queries.setQueryData<RoundData>(roundKey(round.id), previous => previous ? {
        ...previous, your_vote_riff_id: result.riff_id,
      } : previous)
    },
    onSettled: () => queries.invalidateQueries({ queryKey: roundKey(round.id) }),
  })
  const { mutate, isPending } = vote
  const onVote = useCallback((id: string) => {
    if (getSeconds() > 0 && !isPending && !round.your_vote_riff_id) mutate(id)
  }, [getSeconds, isPending, round.your_vote_riff_id, mutate])
  return <VotingPageView submissions={submissions} voteId={round.your_vote_riff_id} votesCount={round.votes_count}
    timer={<Countdown deadline={round.voting_ends_at} serverNow={round.server_now} expiredLabel="Время вышло. Получаем результаты…" />}
    roomId={round.room_id} playingId={player.playingId} onPlay={player.play}
    onVote={onVote}
    disabled={expired || vote.isPending} pendingId={vote.isPending ? vote.variables : undefined}
    error={vote.error?.message || player.error} loading={player.loading} />
}

type VotingPageViewProps = {
  submissions: readonly Submission[]; voteId: string | null; votesCount: number; seconds?: number; timer?: ReactNode; roomId?: string
  playingId: string | null; onPlay: (id: string) => void; onVote: (id: string) => void
  disabled?: boolean; pendingId?: string; error?: string; loading?: boolean
}
export function VotingPageView({ submissions, voteId, votesCount, seconds = 0, timer, roomId, playingId, onPlay, onVote, disabled, pendingId, error, loading }: VotingPageViewProps) {
  const selected = submissions.find(item => item.id === voteId)
  return <>
    <header className={styles.intro}><h1>Слушай. Выбирай.</h1>
      <p>Один голос за чужой рифф. Авторы пока скрыты.</p>
      <strong>Получено голосов: {votesCount}{selected ? ` · твой голос подтверждён за ${selected.title}` : ''}</strong>
      {timer ?? <p role="timer">{seconds ? `Осталось ${countdownLabel(seconds)}` : 'Время вышло. Получаем результаты…'}</p>}
    </header>
    {submissions.length ? <VotingList submissions={submissions} voteId={voteId}
      playingId={playingId} onPlay={onPlay} onVote={onVote} disabled={disabled} pendingId={pendingId} /> :
      <Surface><p>В этом раунде никто не отправил рифф. Итоги появятся по окончании времени.</p></Surface>}
    {submissions.length > 0 && submissions.every(item => item.own) && <p>Пока нет чужих риффов для голосования.</p>}
    <footer className={styles.footer}>
      <p>Итоги появятся по окончании времени голосования. Подтверждённый голос изменить нельзя.</p>
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Загружаем звук…</p>}
      {roomId && <Link to="/rooms/lobby" search={{ roomId, stay: true }}>В комнату →</Link>}
    </footer>
  </>
}
