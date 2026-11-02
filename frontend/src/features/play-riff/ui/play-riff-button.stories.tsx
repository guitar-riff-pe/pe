import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { PlayRiffButton } from './play-riff-button'

const meta = { title: 'Features/Play Riff/Button', component: PlayRiffButton, args: { name: 'Рифф B', playing: false, onPlay: () => {} } } satisfies Meta<typeof PlayRiffButton>
export default meta
type Story = StoryObj<typeof meta>
export const Ready: Story = {}
export const Playing: Story = { args: { playing: true } }
export const CompactMobile: Story = { args: { compactOnMobile: true }, globals: { viewport: { value: 'mobile2', isRotated: false } } }
