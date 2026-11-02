import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ProfileIdentity } from './profile-identity'

const meta = { title: 'Entities/Profiles/Identity', component: ProfileIdentity, args: { profile: { name: 'NeonRiff', handle: '@neonriff', joined: 'с сентября 2026', battles: 48, wins: 12, votes: 184, weeklyBattles: [3, 5, 4, 8, 6, 7, 6, 9] } } } satisfies Meta<typeof ProfileIdentity>
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
