import type { Room } from '@entities/rooms'

export type RoomFiltersValue = {
  query: string
  style: 'all' | Room['style']
  onlyAvailable: boolean
}

export function filterRooms(rooms: Room[], filters: RoomFiltersValue): Room[] {
  const query = filters.query.trim().toLocaleLowerCase('ru')

  return rooms.filter((room) =>
    (!query || room.name.toLocaleLowerCase('ru').includes(query)) &&
    (filters.style === 'all' || room.style === filters.style) &&
    (!filters.onlyAvailable || (room.status === 'waiting' && room.players < room.capacity)),
  )
}
