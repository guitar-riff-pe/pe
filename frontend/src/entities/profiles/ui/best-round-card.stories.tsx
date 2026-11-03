import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { BestRoundCard } from './best-round-card'

const meta = { title: 'Entities/Profiles/Best Round', component: BestRoundCard, args: { round: { title: 'Midnight Garage', place: 1, votes: 7, date: '22 октября' } } } satisfies Meta<typeof BestRoundCard>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
