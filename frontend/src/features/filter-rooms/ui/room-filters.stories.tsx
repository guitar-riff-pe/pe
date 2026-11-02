import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { RoomFilters } from './room-filters'
import type { RoomFiltersValue } from '../model/filter-rooms'

const initialValue: RoomFiltersValue = { query: '', style: 'all', onlyAvailable: false }

function InteractiveFilters({ initial }: { initial: RoomFiltersValue }) {
  const [value, setValue] = useState(initial)
  return <RoomFilters value={value} onChange={setValue} />
}

const meta = {
  title: 'Features/FilterRooms/RoomFilters',
  component: RoomFilters,
  args: { value: initialValue, onChange: () => {} },
  render: (args) => <InteractiveFilters initial={args.value} />,
} satisfies Meta<typeof RoomFilters>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Filtered: Story = { args: { value: { query: 'garage', style: 'Metal', onlyAvailable: true } } }
