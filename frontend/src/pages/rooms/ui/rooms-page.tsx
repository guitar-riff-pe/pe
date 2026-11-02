import { Link } from '@tanstack/react-router'
import { PublicRooms } from '@widgets/public-rooms'
import { SiteHeader } from '@widgets/site-header'
import { demoRooms } from '../model/demo-rooms'
import styles from './rooms-page.module.scss'

export function RoomsPage() {
  return (
    <div className={styles.shell}>
      <SiteHeader />
      <main className={styles.page}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>Найди свой грув</p>
            <h1>Публичные комнаты</h1>
            <p className={styles.lead}>Присоединяйся к открытой комнате или собери собственный баттл.</p>
          </div>
          <Link className={styles.createLink} to="/rooms/create">+ Создать комнату</Link>
        </div>
        <PublicRooms rooms={demoRooms} />
      </main>
    </div>
  )
}
