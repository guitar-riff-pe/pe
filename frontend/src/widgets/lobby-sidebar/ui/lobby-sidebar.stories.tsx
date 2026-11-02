import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { LobbySidebar } from './lobby-sidebar'

const room = {
  name: 'Midnight Garage',
  code: 'X7K2M9',
  capacity: 4,
  bpm: 120,
  bars: 4,
  roundMinutes: 5,
  participants: [
    { id: 'neon', name: 'NeonRiff', role: 'host', isSelf: true },
    { id: 'guitar', name: 'GuitarHero', role: 'guest' },
    { id: 'cat', name: 'LoudCat', role: 'guest' },
    { id: 'empty', name: 'Свободное место', role: 'empty' },
  ],
} as const

const meta = {
  title: 'Widgets/LobbySidebar',
  component: LobbySidebar,
  args: { room: { ...room, participants: [...room.participants] } },
  decorators: [(Story) => <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 532 }}><Story /></div>],
} satisfies Meta<typeof LobbySidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
