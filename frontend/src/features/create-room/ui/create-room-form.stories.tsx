import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { CreateRoomForm } from './create-room-form'

const meta = {
  title: 'Features/CreateRoom/Form',
  component: CreateRoomForm,
  decorators: [(Story) => <div style={{ maxWidth: 640 }}><Story /></div>],
} satisfies Meta<typeof CreateRoomForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
