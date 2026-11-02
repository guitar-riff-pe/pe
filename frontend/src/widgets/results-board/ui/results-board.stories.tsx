import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ResultsBoard } from './results-board'

const meta = {
  title: 'Widgets/Results Board',
  component: ResultsBoard,
  args: {
    results: [
      { id: 'd', place: 1, player: 'NeonRiff', votes: 3, riff: 'Рифф D' },
      { id: 'b', place: 2, player: 'GuitarHero', votes: 1, riff: 'Рифф B' },
      { id: 'c', place: 3, player: 'LoudCat', votes: 0, riff: 'Рифф C' },
      { id: 'a', place: 3, player: 'RiffLord', votes: 0, riff: 'Рифф A' },
    ],
    totalVotes: 4,
    playingId: null,
    onPlay: () => {},
  },
} satisfies Meta<typeof ResultsBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
