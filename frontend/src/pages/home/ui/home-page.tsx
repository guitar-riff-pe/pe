import { Link } from '@tanstack/react-router'
import { RiffPreview } from '@widgets/riff-preview'
import { SiteHeader } from '@widgets/site-header'
import { Button, Surface, TextField } from '@shared/ui'
import styles from './home-page.module.scss'

const steps = [
  { number: '01', title: 'Собери друзей', description: 'Создай комнату и отправь ссылку.' },
  { number: '02', title: 'Поймай ритм', description: 'Общие барабаны. На рифф — 5 минут.' },
  { number: '03', title: 'Выбери лучший', description: 'Слушайте анонимно. Решают голоса.' },
]

export function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span aria-hidden="true" /> Пять минут. Твой рифф.</p>
            <h1 id="home-title">Создавай риффы.<br />Соревнуйся.<br /><span>Будь услышан.</span></h1>
            <p className={styles.lead}>Один бит. Разные характеры.<br />Сочини свою партию и забери голоса друзей.</p>
            <Link className={styles.primaryLink} to="/rooms">Найти комнату <span aria-hidden="true">→</span></Link>
            <p className={styles.caption}>Без регистрации · от 3 игроков</p>
          </div>
          <div className={styles.heroVisual}><RiffPreview /></div>
        </section>

        <Surface className={styles.invitation}>
          <div>
            <h2>Уже есть приглашение?</h2>
            <p>Введи код комнаты и присоединяйся к друзьям.</p>
          </div>
          <div className={styles.invitationControls}>
            <TextField label="Код комнаты" placeholder="Например, X7K2M9" disabled />
            <Button disabled title="Вход по коду появится после подключения комнат">Войти <span aria-hidden="true">→</span></Button>
          </div>
        </Surface>

        <section className={styles.steps} aria-label="Как проходит игра">
          {steps.map((step) => (
            <div className={styles.step} key={step.number}>
              <span className={styles.stepNumber}>{step.number}</span>
              <div><h2>{step.title}</h2><p>{step.description}</p></div>
            </div>
          ))}
        </section>
      </main>
    </>
  )
}
