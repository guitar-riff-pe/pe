import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { EditProfileDialog } from './edit-profile-dialog'

const meta = { title: 'Features/Edit Profile/Dialog', component: EditProfileDialog, args: { name: 'NeonRiff', handle: '@neonriff', onClose: () => {}, onSave: () => {} }, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof EditProfileDialog>
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = {}
export const Mobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
