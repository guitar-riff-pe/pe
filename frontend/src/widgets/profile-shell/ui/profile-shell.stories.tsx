import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ProfileShell } from './profile-shell'

const meta = {
  title: 'Widgets/Profile Shell',
  component: ProfileShell,
  args: { children: <main style={{ padding: 32 }}><h1>Профиль</h1></main> },
  parameters: { layout: 'fullscreen', tanstack: { router: { path: '/profile' } } },
} satisfies Meta<typeof ProfileShell>

export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
