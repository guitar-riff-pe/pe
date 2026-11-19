import { useStartRound } from '@features/start-round'
import { useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { currentRoomOptions, leaveRoom, ParticipantRow, roomKey, roomOptions, roomsKey, toLobbyRoom, type LobbyRoom } from '@entities/rooms'
import { useSession } from '@entities/sessions'
import { roundPath } from '@entities/rounds'
import { Button, Surface } from '@shared/ui'
import { LobbySidebar } from '@widgets/lobby-sidebar'
import { BattleProgress } from '@widgets/battle-progress'
import styles from './lobby-page.module.scss'

export function LobbyPage({ roomId, stay = false }: { roomId?: string; stay?: boolean }) {
  const session = useSession()
  const queries = useQueryClient()
  const navigate = useNavigate()
  const current = useQuery({ ...currentRoomOptions, enabled: !roomId && !!session.data })
  const id = roomId ?? current.data?.id
  const detail = useQuery({ ...roomOptions(id ?? ''), enabled: !!id && !!session.data })
  const room = detail.data
  const start = useStartRound(id)
  const leave = useMutation({
    mutationFn: () => leaveRoom(id!),
    onSuccess: async () => {
      await queries.cancelQueries({ queryKey: roomsKey })
      queries.removeQueries({ queryKey: roomKey(id!) })
      await queries.invalidateQueries({ queryKey: roomsKey, refetchType: 'none' })
      await navigate({ to: '/rooms' })
    },
  })
  useEffect(() => {
    if (!room || leave.isPending) return
    if (room.stage !== 'lobby' && room.current_round_id && !stay) {
      void navigate({ to: roundPath(room.stage), search: { roundId: room.current_round_id }, replace: true })
    } else if (!roomId) void navigate({ to: '/rooms/lobby', search: { roomId: room.id, stay }, replace: true })
  }, [room, roomId, stay, leave.isPending, navigate])

  const error = detail.error ?? current.error ?? session.error
  const loading = session.isPending || (!!session.data && ((!roomId && current.isPending) || (!!id && detail.isPending)))
  if (room && session.data && !error) return <LobbyPageView room={toLobbyRoom(room, session.data.id)} visibility={room.visibility}
    onStart={() => start.mutate()} starting={start.isPending} onLeave={() => leave.mutate()} leaving={leave.isPending}
    error={start.submittedAt > leave.submittedAt ? start.error?.message : leave.error?.message} stage={room.stage} roundId={room.current_round_id} />
  return <main className={styles.page}><BattleProgress stage={1} /><h1>Лобби</h1>
    <Surface>{loading ? <p role="status">Загружаем комнату…</p> : !session.data && !session.error ? <>
      <p>Войди или продолжи гостем, чтобы открыть комнату.</p>
      <Link to="/login" search={{ redirect: `/rooms/lobby${roomId ? `?roomId=${encodeURIComponent(roomId)}` : ''}` }}>Перейти ко входу →</Link>
    </> : error ? <><p role="alert">{error.message}</p><Button variant="secondary" onClick={() => { void session.refetch(); if (id) void detail.refetch(); else void current.refetch() }}>Попробовать снова</Button></>
      : <p>Ты пока не состоишь в комнате.</p>}
      <p><Link to="/rooms">К списку комнат →</Link></p>
    </Surface>
  </main>
}

export function LobbyPageView({ room, visibility = 'public', onStart, onLeave, starting, leaving, error, stage = 'lobby', roundId }: {
  room: LobbyRoom; visibility?: 'public' | 'private'; onStart?: () => void; onLeave?: () => void;
  starting?: boolean; leaving?: boolean; error?: string; stage?: 'lobby' | 'composing' | 'voting' | 'results'; roundId?: string | null
}) {
  const playersCount = room.participants.filter(participant => participant.role !== 'empty').length
  return (
      <main className={styles.page}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Комната {room.code}</p>
          <h1>{room.name}</h1>
          <p>{visibility === 'private' ? 'Приватная' : 'Публичная'} комната · <span className={styles.desktopSubtitle}>пригласи друзей или дождись новых участников.</span><span className={styles.mobileSubtitle}>{playersCount} из {room.capacity} игроков</span></p>
        </header>

        <div className={styles.layout}>
          <section className={styles.participants} aria-label="Участники комнаты">
            <h2>Участники · {playersCount} / {room.capacity}</h2>
            <div className={styles.people}>
              {room.participants.map((participant) => <ParticipantRow key={participant.id} participant={participant} />)}
            </div>
          </section>
          <LobbySidebar room={room} onStart={onStart} starting={starting} error={error} stage={stage} roundId={roundId} />
        </div>
        <Button className={styles.leave} variant="ghost" pending={leaving} disabled={!onLeave || starting} onClick={onLeave}>Выйти из комнаты</Button>
      </main>
  )
}
