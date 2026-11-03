import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { JoinRoomButton } from './join-room-button'

const meta = { title: 'Features/Join Room/Button', component: JoinRoomButton } satisfies Meta<typeof JoinRoomButton>
export default meta
type Story = StoryObj<typeof meta>
export const PendingIntegration: Story = {}
