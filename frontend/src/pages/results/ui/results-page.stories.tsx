import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { BattleProgress } from '@widgets/battle-progress'
import { ResultsBoard } from '@widgets/results-board'
import { useDemoRiffPlayer } from '@entities/riffs'
import { demoResults } from '../model/demo-results'
import styles from './results-page.module.scss'

function Preview() {
  const player = useDemoRiffPlayer()
  return <main className={styles.page}><BattleProgress stage={4} />
    <header className={styles.intro}><h1>Вот это рифф!</h1><p>Учтено голосов: 4 · один голос от игрока</p></header>
    <ResultsBoard results={demoResults} totalVotes={4} playingId={player.playingId} onPlay={id => void player.play(id)} />
  </main>
}
const meta = {
  title: 'Pages/Results', component: Preview,
  parameters: { layout: 'fullscreen', tanstack: { router: { route: { path: '/rooms/results' }, path: '/rooms/results' } } },
} satisfies Meta<typeof Preview>
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
