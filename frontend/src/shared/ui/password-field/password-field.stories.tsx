import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { PasswordField } from './password-field'

const meta = {
  title: 'Shared/UI/PasswordField',
  component: PasswordField,
  args: { label: 'Пароль', placeholder: 'Не менее 8 символов', autoComplete: 'current-password' },
  decorators: [(Story) => <div style={{ maxWidth: 440 }}><Story /></div>],
} satisfies Meta<typeof PasswordField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Invalid: Story = { args: { error: 'Введите пароль.' } }
export const Visible: Story = {
  args: { defaultValue: 'riffbattle8' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Показать пароль' }))
    await expect(canvas.getByRole('textbox', { name: 'Пароль' })).toHaveAttribute('type', 'text')
  },
}
