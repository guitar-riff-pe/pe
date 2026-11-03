import { Link } from '@tanstack/react-router'
import { ParticipantRow } from '@entities/rooms'
import { LobbySidebar } from '@widgets/lobby-sidebar'
import { BattleProgress } from '@widgets/battle-progress'
import { SiteHeader } from '@widgets/site-header'
import { demoLobby } from '../model/demo-lobby'
import styles from './lobby-page.module.scss'

const playersCount = demoLobby.participants.filter((participant) => participant.role !== 'empty').length

export function LobbyPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <BattleProgress stage={1} />

        <header className={styles.intro}>
          <h1>{demoLobby.name}</h1>
          <p>{playersCount} из {demoLobby.capacity} игроков · можно начать от 3 игроков</p>
        </header>

        <div className={styles.layout}>
          <section className={styles.participants} aria-label="Участники комнаты">
            <h2>Участники</h2>
            <div className={styles.people}>
              {demoLobby.participants.map((participant) => <ParticipantRow key={participant.id} participant={participant} />)}
            </div>
            <Link className={styles.leave} to="/rooms">Покинуть комнату</Link>
          </section>
          <LobbySidebar room={demoLobby} />
        </div>
      </main>
    </>
  )
}
