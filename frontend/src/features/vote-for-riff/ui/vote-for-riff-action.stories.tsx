import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { VoteForRiffAction } from './vote-for-riff-action'

const meta = { title: 'Features/Vote For Riff/Action', component: VoteForRiffAction, args: { state: 'available', onVote: () => {} } } satisfies Meta<typeof VoteForRiffAction>
export default meta
type Story = StoryObj<typeof meta>
export const Available: Story = {}
export const Confirmed: Story = { args: { state: 'confirmed' } }
export const Locked: Story = { args: { state: 'locked' } }
