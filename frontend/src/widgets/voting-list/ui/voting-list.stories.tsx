import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { useDemoVoting } from '@features/vote-for-riff'
import { VotingList } from './voting-list'

const submissions = [
  { id: 'a', title: 'Рифф A', seed: 1 },
  { id: 'b', title: 'Рифф B', seed: 2 },
  { id: 'c', title: 'Рифф C', seed: 3 },
  { id: 'own', title: 'Твой рифф', seed: 4, own: true },
]

function Preview() {
  const voting = useDemoVoting(null)
  return <VotingList submissions={submissions} voteId={voting.voteId} playingId={voting.playingId} onPlay={(id) => void voting.play(id)} onVote={voting.vote} />
}

const meta = {
  title: 'Widgets/VotingList',
  component: VotingList,
  args: { submissions, voteId: null, playingId: null, onPlay: () => undefined, onVote: () => undefined },
  render: () => <Preview />,
} satisfies Meta<typeof VotingList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
