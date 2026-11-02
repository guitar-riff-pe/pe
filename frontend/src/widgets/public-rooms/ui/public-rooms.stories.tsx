import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { PublicRooms } from './public-rooms'

const meta = {
  title: 'Widgets/PublicRooms',
  component: PublicRooms,
  args: {
    rooms: [
      { id: 'midnight-garage', name: 'Midnight Garage', style: 'Metal', bpm: 120, players: 3, capacity: 6, status: 'waiting' },
      { id: 'clean-and-simple', name: 'Clean & Simple', style: 'Indie', bpm: 96, players: 2, capacity: 4, status: 'waiting' },
      { id: 'heavy-friday', name: 'Heavy Friday', style: 'Rock', bpm: 140, players: 4, capacity: 6, status: 'playing' },
    ],
  },
} satisfies Meta<typeof PublicRooms>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Empty: Story = { args: { rooms: [] } }
