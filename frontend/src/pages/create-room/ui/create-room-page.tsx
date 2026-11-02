import { CreateRoomForm } from '@features/create-room'
import { SiteHeader } from '@widgets/site-header'
import { Surface } from '@shared/ui'
import styles from './create-room-page.module.scss'

const rules = [
  'От 2 игроков для старта',
  '5 минут на создание риффа',
  'Общие барабаны и темп',
  'Анонимное голосование',
]

export function CreateRoomPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Твой баттл</p>
          <h1>Создать комнату</h1>
          <p>Ты станешь хостом и сможешь запустить раунд, когда соберутся игроки.</p>
        </header>
        <div className={styles.content}>
          <CreateRoomForm />
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
    </>
  )
}
