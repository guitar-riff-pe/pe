import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ProfileRhythm } from './profile-rhythm'

const meta = { title: 'Widgets/Profile Rhythm', component: ProfileRhythm, args: { weeklyBattles: [3, 5, 4, 8, 6, 7, 6, 9], totalBattles: 48 } } satisfies Meta<typeof ProfileRhythm>
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
