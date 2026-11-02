import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect } from 'storybook/test'
import { Surface } from '@shared/ui'
import { SignInForm } from './sign-in-form'

const meta = {
  title: 'Features/AccountAccess/SignInForm',
  component: SignInForm,
  decorators: [(Story) => <Surface style={{ maxWidth: 506, padding: 32 }}><Story /></Surface>],
} satisfies Meta<typeof SignInForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const ValidationErrors: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Войти' }))
    await expect(canvas.getByText('Введи корректную электронную почту.')).toBeVisible()
    await expect(canvas.getByText('Введи пароль.')).toBeVisible()
  },
}
export const ReadyToSubmit: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Электронная почта' }), 'player@example.com')
    await userEvent.type(canvas.getByLabelText('Пароль'), 'riffbattle8')
    await userEvent.click(canvas.getByRole('button', { name: 'Войти' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('сервер авторизации ещё не подключён')
  },
}
