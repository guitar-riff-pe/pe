import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Status } from './status'

const meta = {
  title: 'Shared/UI/Status',
  component: Status,
  args: { children: 'Ожидание игроков' },
} satisfies Meta<typeof Status>

export default meta
type Story = StoryObj<typeof meta>

export const Waiting: Story = { args: { tone: 'accent' } }
export const Playing: Story = { args: { tone: 'neutral', children: 'Раунд идёт' } }
export const Success: Story = { args: { tone: 'success', children: 'Рифф отправлен' } }
export const Error: Story = { args: { tone: 'danger', children: 'Не удалось подключиться' } }
