import { useMemo, useState } from 'react'
import { RoomCard, type Room } from '@entities/rooms'
import { filterRooms, RoomFilters, type RoomFiltersValue } from '@features/filter-rooms'
import { JoinRoomButton } from '@features/join-room'
import { Surface } from '@shared/ui'
import styles from './public-rooms.module.scss'

type PublicRoomsProps = { rooms: Room[] }

export function PublicRooms({ rooms }: PublicRoomsProps) {
  const [filters, setFilters] = useState<RoomFiltersValue>({ query: '', style: 'all', onlyAvailable: false })
  const filteredRooms = useMemo(() => filterRooms(rooms, filters), [rooms, filters])

  return (
    <section className={styles.section} aria-label="Список публичных комнат">
      <RoomFilters value={filters} onChange={setFilters} />
      <div className={styles.list} aria-live="polite">
        <div className={styles.head} aria-hidden="true">
          <span>Комната</span><span>Стиль / темп</span><span>Игроки</span><span>Статус</span>
        </div>
        {filteredRooms.length > 0
          ? filteredRooms.map((room) => <RoomCard key={room.id} room={room} action={<JoinRoomButton />} />)
          : <Surface><p className={styles.empty}>Комнаты не найдены. Измени поиск или фильтры.</p></Surface>}
      </div>
    </section>
  )
}
