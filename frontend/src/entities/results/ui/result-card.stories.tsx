import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Button } from '@shared/ui'
import { ResultCard } from './result-card'

const meta = {
  title: 'Entities/Results/Result Card',
  component: ResultCard,
  args: { result: { id: 'd', place: 1, player: 'NeonRiff', votes: 3, riff: 'Рифф D' }, totalVotes: 4, playing: false, playAction: <Button variant="secondary" fullWidth>▶ Прослушать рифф</Button> },
} satisfies Meta<typeof ResultCard>

export default meta
type Story = StoryObj<typeof meta>

export const Winner: Story = {}
export const RunnerUp: Story = { args: { result: { id: 'b', place: 2, player: 'GuitarHero', votes: 1, riff: 'Рифф B' } } }
export const WinnerMobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
