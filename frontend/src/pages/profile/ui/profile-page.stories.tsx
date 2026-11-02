import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ProfilePage } from './profile-page'

const meta = { title: 'Pages/Profile', component: ProfilePage, parameters: { layout: 'fullscreen', tanstack: { router: { path: '/profile' } } } } satisfies Meta<typeof ProfilePage>
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
