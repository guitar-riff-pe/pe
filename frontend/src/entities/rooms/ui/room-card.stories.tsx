import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Button } from '@shared/ui'
import { RoomCard } from './room-card'

const meta = {
  title: 'Entities/Rooms/RoomCard',
  component: RoomCard,
  args: {
    room: { id: 'midnight-garage', name: 'Midnight Garage', style: 'Metal', bpm: 120, players: 3, capacity: 6, status: 'waiting' },
    action: <Button variant="secondary" fullWidth disabled>В комнату →</Button>,
  },
} satisfies Meta<typeof RoomCard>

export default meta
type Story = StoryObj<typeof meta>

export const Waiting: Story = {}
export const Playing: Story = {
  args: { room: { id: 'heavy-friday', name: 'Heavy Friday', style: 'Rock', bpm: 140, players: 4, capacity: 6, status: 'playing' } },
}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
