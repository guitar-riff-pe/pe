import { Counter } from '@features/counter'
import { SaveLocalNote } from '@features/save-local-note'
import { ApiStatus } from '@widgets/api-status'
import styles from './home-page.module.scss'

export function HomePage() {
  return (
    <main className={styles.page}>
      <h1>PE · Monorepo</h1>
      <p>React · TanStack Start / Query · Zustand · Dexie · FastAPI</p>
      <section><h2>API / TanStack Query</h2><ApiStatus /></section>
      <section><h2>Состояние / Zustand</h2><Counter /></section>
      <section><h2>Локальные данные / Dexie</h2><SaveLocalNote /></section>
    </main>
  )
}
