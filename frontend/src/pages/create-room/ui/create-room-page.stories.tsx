import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { CreateRoomPageView } from './create-room-page'

const meta = {
  title: 'Pages/CreateRoom',
  component: CreateRoomPageView,
  parameters: { layout: 'fullscreen', tanstack: { router: { route: { path: '/rooms/create' }, path: '/rooms/create' } } },
} satisfies Meta<typeof CreateRoomPageView>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
