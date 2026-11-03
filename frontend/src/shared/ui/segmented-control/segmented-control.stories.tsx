import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { SegmentedControl } from './segmented-control'

function Preview() {
  const [value, setValue] = useState('public')
  return (
    <SegmentedControl
      label="Видимость"
      value={value}
      onValueChange={setValue}
      options={[{ value: 'public', label: 'Публичная' }, { value: 'private', label: 'Приватная' }]}
      hint={value === 'public' ? 'Комната появится в общем списке.' : 'Вход только по приглашению.'}
    />
  )
}

const meta = {
  title: 'Shared/UI/SegmentedControl',
  component: SegmentedControl,
  args: {
    label: 'Видимость',
    value: 'public',
    options: [{ value: 'public', label: 'Публичная' }, { value: 'private', label: 'Приватная' }],
    onValueChange: () => undefined,
  },
  render: () => <Preview />,
} satisfies Meta<typeof SegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
