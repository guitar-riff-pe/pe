import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ProfileHistory } from './profile-history'

const battles = [
  { id: '1', title: 'Midnight Garage', date: '22 окт', place: 1, votes: 7 },
  { id: '2', title: 'Clean & Simple', date: '20 окт', place: 3, votes: 2 },
  { id: '3', title: 'Electric Morning', date: '18 окт', place: 2, votes: 5 },
]
const meta = { title: 'Widgets/Profile History', component: ProfileHistory, args: { battles, expanded: false, onToggle: () => {} } } satisfies Meta<typeof ProfileHistory>
export default meta
type Story = StoryObj<typeof meta>
export const Recent: Story = {}
export const Full: Story = { args: { expanded: true } }
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
