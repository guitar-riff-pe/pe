import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ProfilePageView } from './profile-page'
import { demoProfile, demoBattles, demoBestRound } from '../model/demo-profile'

const meta = {
  title: 'Pages/Profile', component: ProfilePageView,
  args: { profile: demoProfile, battles: demoBattles, bestRound: demoBestRound, onSave: async () => {} },
  parameters: { layout: 'fullscreen', tanstack: { router: { route: { path: '/profile' }, path: '/profile' } } },
} satisfies Meta<typeof ProfilePageView>
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
