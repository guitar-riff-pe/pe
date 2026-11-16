import { useMemo, useState } from 'react'
import { RoomCard, type Room } from '@entities/rooms'
import { useSession } from '@entities/sessions'
import { filterRooms, RoomFilters, type RoomFiltersValue } from '@features/filter-rooms'
import { JoinRoomButton } from '@features/join-room'
import { Surface } from '@shared/ui'
import styles from './public-rooms.module.scss'

type PublicRoomsProps = { rooms: Room[]; filters?: RoomFiltersValue; onFiltersChange?: (value: RoomFiltersValue) => void }

export function PublicRooms({ rooms, filters: controlledFilters, onFiltersChange }: PublicRoomsProps) {
  const { data: player } = useSession()
  const [localFilters, setFilters] = useState<RoomFiltersValue>({ query: '', style: 'all', onlyAvailable: false })
  const filters = controlledFilters ?? localFilters
  const filteredRooms = useMemo(() => filterRooms(rooms, filters), [rooms, filters])

  return (
    <section className={styles.section} aria-label="Список публичных комнат">
      <RoomFilters value={filters} onChange={onFiltersChange ?? setFilters} />
      <div className={styles.list} aria-live="polite">
        <div className={styles.head} aria-hidden="true">
          <span>Комната</span><span>Стиль / темп</span><span>Игроки</span><span>Статус</span>
        </div>
        {filteredRooms.length > 0
          ? filteredRooms.map((room) => {
            const own = room.members?.some(member => member.id === player?.id)
            const full = room.players >= room.capacity
            const playing = room.status === 'playing'
            return <RoomCard key={room.id} room={room} action={<JoinRoomButton code={room.code} disabled={!own && (playing || full)}
              label={own ? 'Вернуться →' : playing ? 'В игре' : full ? 'Нет мест' : 'Войти →'} />} />
          })
          : <Surface><p className={styles.empty}>{rooms.length ? 'Комнаты не найдены. Измени поиск или фильтры.' : 'Пока нет открытых комнат. Создай первую или войди по коду.'}</p></Surface>}
      </div>
    </section>
  )
}
