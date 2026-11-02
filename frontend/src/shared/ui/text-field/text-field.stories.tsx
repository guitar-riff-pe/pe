import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { TextField } from './text-field'

const meta = {
  title: 'Shared/UI/TextField',
  component: TextField,
  args: { label: 'Электронная почта', placeholder: 'you@example.com' },
  decorators: [(Story) => <div style={{ maxWidth: 400 }}><Story /></div>],
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithHint: Story = { args: { hint: 'Используй адрес для входа в аккаунт.' } }
export const Invalid: Story = { args: { error: 'Проверь адрес электронной почты.' } }
export const Disabled: Story = { args: { disabled: true, value: 'you@example.com' } }
