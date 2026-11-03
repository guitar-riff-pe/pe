import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ParticipantRow } from './participant-row'

const meta = {
  title: 'Entities/Rooms/ParticipantRow',
  component: ParticipantRow,
  args: { participant: { id: 'neon', name: 'NeonRiff', role: 'host', isSelf: true } },
} satisfies Meta<typeof ParticipantRow>

export default meta
type Story = StoryObj<typeof meta>

export const Host: Story = {}
export const Guest: Story = { args: { participant: { id: 'guitar', name: 'GuitarHero', role: 'guest' } } }
export const Empty: Story = { args: { participant: { id: 'empty', name: 'Свободное место', role: 'empty' } } }
