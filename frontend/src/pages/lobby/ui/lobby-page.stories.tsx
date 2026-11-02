import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { LobbyPage } from './lobby-page'

const meta = {
  title: 'Pages/Lobby',
  component: LobbyPage,
  parameters: { layout: 'fullscreen', tanstack: { router: { path: '/rooms/lobby' } } },
} satisfies Meta<typeof LobbyPage>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
