import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { SelectField } from './select-field'

const options = [
  { value: 'all', label: 'Все стили' },
  { value: 'rock', label: 'Rock' },
  { value: 'metal', label: 'Metal' },
  { value: 'indie', label: 'Indie' },
]

const meta = {
  title: 'Shared/UI/SelectField',
  component: SelectField,
  args: { label: 'Музыкальный стиль', defaultValue: 'all', options },
  decorators: [(Story) => <div style={{ maxWidth: 400 }}><Story /></div>],
} satisfies Meta<typeof SelectField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Opened: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox'))
  },
}
export const Invalid: Story = { args: { error: 'Выбери стиль.' } }
export const Disabled: Story = { args: { disabled: true } }
export const KeyboardSelection: Story = {
  args: { onValueChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const combobox = canvas.getByRole('combobox')
    await userEvent.click(combobox)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(combobox).toHaveAttribute('aria-expanded', 'false')
    await expect(combobox).toHaveTextContent('Rock')
    await expect(args.onValueChange).toHaveBeenCalledWith('rock')
  },
}
export const EscapeKeepsValue: Story = {
  play: async ({ canvas, userEvent }) => {
    const combobox = canvas.getByRole('combobox')
    await userEvent.click(combobox)
    await userEvent.keyboard('{ArrowDown}{Escape}')
    await expect(combobox).toHaveAttribute('aria-expanded', 'false')
    await expect(combobox).toHaveTextContent('Все стили')
  },
}
