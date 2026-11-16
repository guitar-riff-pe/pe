import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { useDemoVoting } from '@features/vote-for-riff'
import { SiteHeader } from '@widgets/site-header'
import { BattleProgress } from '@widgets/battle-progress'
import { VotingPageView } from './voting-page'
import { demoSubmissions } from '../model/demo-submissions'
import styles from './voting-page.module.scss'

function Preview({ initialVote = 'b' }: { initialVote?: string | null }) {
  const voting = useDemoVoting(initialVote)
  return <><SiteHeader /><main className={styles.page}><BattleProgress stage={3} />
    <VotingPageView submissions={demoSubmissions} voteId={voting.voteId} votesCount={voting.votesCount}
      seconds={272} playingId={voting.playingId} onPlay={id => void voting.play(id)} onVote={voting.vote} />
  </main></>
}
const meta = {
  title: 'Pages/Voting', component: Preview, args: { initialVote: 'b' },
  parameters: { layout: 'fullscreen', tanstack: { router: { route: { path: '/rooms/vote' }, path: '/rooms/vote' } } },
} satisfies Meta<typeof Preview>
export default meta
type Story = StoryObj<typeof meta>
export const Confirmed: Story = {}
export const ConfirmedMobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const BeforeVoting: Story = { args: { initialVote: null } }
export const BeforeVotingMobile: Story = { ...BeforeVoting, globals: { viewport: { value: 'mobile2', isRotated: false } } }
