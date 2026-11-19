import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { currentRoomOptions, publicRoomsOptions, type Room, type RoomRecord } from '@entities/rooms'
import { useSession } from '@entities/sessions'
import { JoinRoomForm } from '@features/join-room'
import type { RoomFiltersValue } from '@features/filter-rooms'
import { Button, ErrorState, Surface } from '@shared/ui'
import { PublicRooms } from '@widgets/public-rooms'
import styles from './rooms-page.module.scss'

type FiltersProps = { filters?: RoomFiltersValue; onFiltersChange?: (value: RoomFiltersValue) => void }

export function RoomsPage({ code, filters, onFiltersChange }: { code?: string } & FiltersProps) {
  const session = useSession()
  const rooms = useQuery(publicRoomsOptions)
  const current = useQuery({ ...currentRoomOptions, enabled: !!session.data })
  return <RoomsPageView rooms={rooms.data ?? []} initialCode={code} loading={rooms.isPending}
    error={rooms.error ?? undefined} onRetry={() => void rooms.refetch()} currentRoom={current.data} filters={filters} onFiltersChange={onFiltersChange} />
}

export function RoomsPageView({ rooms, initialCode, loading, error, onRetry, currentRoom, filters, onFiltersChange }: {
  rooms: Room[]; initialCode?: string; loading?: boolean; error?: Error | string; onRetry?: () => void; currentRoom?: RoomRecord | null
} & FiltersProps) {
  if (error && !loading && rooms.length === 0) return <main className={styles.page}>
    <ErrorState error={typeof error === 'string' ? { status: 400, message: error } : error} onRetry={onRetry} />
  </main>
  return (
      <main className={styles.page}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>Найди свой грув</p>
            <h1>Публичные комнаты</h1>
            <p className={styles.lead}>Присоединяйся к открытой комнате или собери собственный баттл.</p>
          </div>
          <Link className={styles.createLink} to="/rooms/create">+ Создать комнату</Link>
        </div>
        {currentRoom && <Surface className={styles.current}>
          <p>Твоя комната: <strong>{currentRoom.name}</strong></p>
          <Link to="/rooms/lobby" search={{ roomId: currentRoom.id, stay: true }}>Вернуться в комнату →</Link>
        </Surface>}
        {error && <Surface className={styles.notice}><p role="alert">{typeof error === 'string' ? error : error.message}</p><Button variant="secondary" onClick={onRetry}>Попробовать снова</Button></Surface>}
        {loading ? <Surface><p role="status">Загружаем комнаты…</p></Surface> : (!error || rooms.length > 0) && <PublicRooms rooms={rooms} filters={filters} onFiltersChange={onFiltersChange} />}
        <details className={styles.join} open={initialCode ? true : undefined} key={initialCode ?? 'code'}>
          <summary>Есть код приватной комнаты? Войти по коду →</summary>
          <JoinRoomForm key={initialCode} initialCode={initialCode} />
        </details>
      </main>
  )
}
