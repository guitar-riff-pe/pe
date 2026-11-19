import { Link } from '@tanstack/react-router'
import { Button, ErrorState, Surface } from '@shared/ui'
import type { useRoundSession } from '../model/use-round-session'

export function RoundConnectionStatus({ state }: { state: ReturnType<typeof useRoundSession> }) {
  if (!state.error && state.fetchStatus !== 'paused') return null
  return <Surface><p role="alert">Не удалось обновить раунд. Проверьте соединение. Показаны последние полученные данные.</p>
    <Button variant="secondary" onClick={state.retry} pending={state.isFetching}>Обновить раунд</Button>
  </Surface>
}

export function RoundSessionStatus({ state, returnTo }: { state: ReturnType<typeof useRoundSession>; returnTo: string }) {
  if (state.error && !state.loading) return <ErrorState error={state.error} onRetry={state.retry} />
  return <Surface>{state.loading ? <p role="status">Загружаем раунд…</p> : !state.session.data && !state.session.error ? <>
    <p>Войди или продолжи гостем, чтобы участвовать в раунде.</p><Link to="/login" search={{ redirect: returnTo }}>Перейти ко входу →</Link>
  </> :
    <p role="status">{state.data ? 'Переходим к текущему этапу…' : 'Сейчас нет активного раунда.'}</p>}
    <p><Link to="/rooms">К списку комнат →</Link></p>
  </Surface>
}
