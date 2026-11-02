import type { ReactNode } from 'react'
import { Surface } from '@shared/ui'
import styles from './auth-layout.module.scss'

const waveBars = Array.from({ length: 104 }, (_, index) => {
  const wave = Math.abs(Math.sin(index * 0.18) * Math.cos(index * 0.43))
  return 8 + wave * 90
})

export function AuthLayout({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <main className={[styles.layout, centered && styles.centered].filter(Boolean).join(' ')}>
      {!centered ? <aside className={styles.hero} aria-label="О Riff Battle">
        <p className={styles.eyebrow}>Твой звук. Твоё имя.</p>
        <h1>Включайся<br />в баттл.</h1>
        <p className={styles.heroDescription}>Гости играют наравне со всеми.<br />Аккаунт сохранит твою статистику.</p>
        <svg className={styles.wave} viewBox="0 0 624 110" aria-hidden="true">
          {waveBars.map((height, index) => (
            <rect key={index} x={index * 6} y={(110 - height) / 2} width="2" height={height} rx="1" />
          ))}
        </svg>
      </aside> : null}
      {centered
        ? <div className={styles.centeredContent}>{children}</div>
        : <Surface padding="none" className={styles.card}>{children}</Surface>}
    </main>
  )
}
