import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { BattleRow } from './battle-row'

const meta = { title: 'Entities/Profiles/Battle Row', component: BattleRow, args: { battle: { id: '1', title: 'Midnight Garage', date: '22 окт', place: 1, votes: 7 } } } satisfies Meta<typeof BattleRow>
export default meta
type Story = StoryObj<typeof meta>
export const Winner: Story = {}
export const Other: Story = { args: { battle: { id: '2', title: 'Clean & Simple', date: '20 окт', place: 3, votes: 2 } } }
