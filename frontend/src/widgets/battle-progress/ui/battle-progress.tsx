import styles from './battle-progress.module.scss'

const stages = ['Комната', 'Создание риффа', 'Голосование', 'Результат'] as const

export function BattleProgress({ stage }: { stage: 1 | 2 | 3 | 4 }) {
  return <>
    <ol className={styles.progress} aria-label="Этапы баттла">
      {stages.map((label, index) => <li className={index + 1 === stage ? styles.current : undefined} key={label} aria-current={index + 1 === stage ? 'step' : undefined}>
        {index + 1} {label}{index < stages.length - 1 ? <span aria-hidden="true"> →</span> : null}
      </li>)}
    </ol>
    <p className={styles.mobileProgress}>{stage}/4 · {stages[stage - 1]}</p>
  </>
}
