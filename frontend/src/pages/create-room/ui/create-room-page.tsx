import { CreateRoomForm } from '@features/create-room'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { currentRoomOptions } from '@entities/rooms'
import { useSession } from '@entities/sessions'
import { Button, Surface } from '@shared/ui'
import styles from './create-room-page.module.scss'

const rules = [
  'От 3 игроков для старта',
  '5 минут на создание риффа',
  'Общие барабаны и темп',
  'Анонимное голосование',
]

export function CreateRoomPage() {
  const session = useSession()
  const current = useQuery({ ...currentRoomOptions, enabled: !!session.data })
  let content: ReactNode
  if (session.isPending || (session.data && current.isPending)) content = <Surface><p role="status">Проверяем текущую комнату…</p></Surface>
  else if (session.error) content = <Surface><p role="alert">{session.error.message}</p><Button variant="secondary" onClick={() => void session.refetch()}>Попробовать снова</Button></Surface>
  else if (!session.data) content = <Surface><p>Войди или продолжи гостем, чтобы создать комнату.</p><Link to="/login" search={{ redirect: '/rooms/create' }}>Перейти ко входу →</Link></Surface>
  else if (current.error) content = <Surface><p role="alert">{current.error.message}</p><Button variant="secondary" onClick={() => void current.refetch()}>Попробовать снова</Button></Surface>
  else if (current.data) content = <Surface><p>Ты уже в комнате <strong>{current.data.name}</strong>. Сначала выйди из неё, чтобы создать другую.</p><Link to="/rooms/lobby" search={{ roomId: current.data.id, stay: true }}>Вернуться в комнату →</Link></Surface>
  return <CreateRoomPageView>{content}</CreateRoomPageView>
}

export function CreateRoomPageView({ children }: { children?: ReactNode }) {
  return (
      <main className={styles.page}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Твой баттл</p>
          <h1>Создать комнату</h1>
          <p>Ты станешь хостом и сможешь запустить раунд, когда соберутся игроки.</p>
        </header>
        <div className={styles.content}>
          {children ?? <CreateRoomForm />}
          <Surface className={styles.rules}>
            <h2>Один бит. Равные условия.</h2>
            <ol>
              {rules.map((rule, index) => (
                <li key={rule}><span>{String(index + 1).padStart(2, '0')}</span>{rule}</li>
              ))}
            </ol>
          </Surface>
        </div>
      </main>
  )
}
