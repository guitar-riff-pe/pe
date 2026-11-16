import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { RoomsPageView } from './rooms-page'
import { demoRooms } from '../model/demo-rooms'

const meta = {
  title: 'Pages/Rooms',
  component: RoomsPageView,
  args: { rooms: demoRooms.map((room, index) => ({ ...room, code: `ROOM${index + 1}` })) },
  parameters: { layout: 'fullscreen', tanstack: { router: { route: { path: '/rooms' }, path: '/rooms' } } },
} satisfies Meta<typeof RoomsPageView>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const Empty: Story = { args: { rooms: [] } }
export const Loading: Story = { args: { rooms: [], loading: true } }
export const Error: Story = { args: { rooms: [], error: 'Не удалось загрузить комнаты. Попробуй ещё раз.' } }
export const Invitation: Story = { args: { initialCode: 'X7K2M9' } }
