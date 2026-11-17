export type RoomSearch = { code?: string; query?: string; style?: 'Rock' | 'Metal' | 'Indie' | 'Любой стиль'; onlyAvailable?: boolean }

export function parseRoomSearch(search: Record<string, unknown>): RoomSearch {
  return {
    code: typeof search.code === 'string' ? search.code.trim().toUpperCase() || undefined : undefined,
    query: typeof search.query === 'string' ? search.query || undefined : undefined,
    style: search.style === 'Rock' || search.style === 'Metal' || search.style === 'Indie' || search.style === 'Любой стиль' ? search.style : undefined,
    onlyAvailable: search.onlyAvailable === true || search.onlyAvailable === 'true' ? true : undefined,
  }
}
