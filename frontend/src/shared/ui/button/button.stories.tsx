import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Button } from './button'

const meta = {
  title: 'Shared/UI/Button',
  component: Button,
  args: { children: 'Создать комнату' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary', children: 'Продолжить гостем' } }
export const Ghost: Story = { args: { variant: 'ghost', children: 'Назад' } }
export const Pending: Story = { args: { pending: true, children: 'Сохраняем…' } }
export const Disabled: Story = { args: { disabled: true, children: 'В комнату →' } }
