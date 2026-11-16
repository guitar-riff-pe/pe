import { createFileRoute } from '@tanstack/react-router'
import { RoomsPage } from '@pages/rooms'
import { parseRoomSearch } from '@features/filter-rooms'

export const Route = createFileRoute('/rooms')({
  validateSearch: parseRoomSearch,
  component: RoomsRoute,
})

function RoomsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return <RoomsPage code={search.code} filters={{ query: search.query ?? '', style: search.style ?? 'all', onlyAvailable: search.onlyAvailable ?? false }}
    onFiltersChange={filters => void navigate({ search: previous => ({
      ...previous, query: filters.query || undefined, style: filters.style === 'all' ? undefined : filters.style,
      onlyAvailable: filters.onlyAvailable || undefined,
    }), replace: true, resetScroll: false })} />
}
