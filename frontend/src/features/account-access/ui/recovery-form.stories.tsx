import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { RecoveryForm } from './recovery-form'

const meta = {
  title: 'Features/AccountAccess/RecoveryForm',
  component: RecoveryForm,
  decorators: [(Story) => <div style={{ maxWidth: 440, margin: '60px auto' }}><Story /></div>],
} satisfies Meta<typeof RecoveryForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const ValidationError: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Отправить ссылку' }))
    await expect(canvas.getByText('Введи корректную электронную почту.')).toBeVisible()
  },
}
export const ReadyToSubmit: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Электронная почта' }), 'player@example.com')
    await userEvent.click(canvas.getByRole('button', { name: 'Отправить ссылку' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('почтовый сервис ещё не подключён')
  },
}
