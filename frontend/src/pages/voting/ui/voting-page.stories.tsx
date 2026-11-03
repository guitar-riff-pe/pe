import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { VotingPage } from './voting-page'

const meta = {
  title: 'Pages/Voting',
  component: VotingPage,
  args: { initialVote: 'b' },
  parameters: { layout: 'fullscreen', tanstack: { router: { path: '/rooms/vote' } } },
} satisfies Meta<typeof VotingPage>

export default meta
type Story = StoryObj<typeof meta>

export const Confirmed: Story = {}
export const ConfirmedMobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const BeforeVoting: Story = { args: { initialVote: null } }
export const BeforeVotingMobile: Story = { args: { initialVote: null }, globals: { viewport: { value: 'mobile2', isRotated: false } } }
