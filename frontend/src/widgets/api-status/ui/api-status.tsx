import { useQuery } from '@tanstack/react-query'
import { healthQueryOptions } from '@entities/health'

export function ApiStatus() {
  const { data, isPending, isError, refetch } = useQuery(healthQueryOptions())
  if (isPending) return <p>Подключение к API…</p>
  if (isError) return <p>API недоступен. <button onClick={() => void refetch()}>Повторить</button></p>
  return <p>{data.service}: {data.status}</p>
}
