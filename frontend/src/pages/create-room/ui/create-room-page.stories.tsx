import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { CreateRoomPage } from './create-room-page'

const meta = {
  title: 'Pages/CreateRoom',
  component: CreateRoomPage,
  parameters: { layout: 'fullscreen', tanstack: { router: { path: '/rooms/create' } } },
} satisfies Meta<typeof CreateRoomPage>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
