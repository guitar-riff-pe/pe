import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { AuthPage } from './auth-page'

const meta = {
  title: 'Pages/Auth',
  component: AuthPage,
  args: { mode: 'sign-in' },
  parameters: { layout: 'fullscreen', tanstack: { router: { path: '/login' } } },
} satisfies Meta<typeof AuthPage>

export default meta
type Story = StoryObj<typeof meta>

export const SignIn: Story = {}
export const SignInMobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const SignUp: Story = { args: { mode: 'sign-up' } }
export const SignUpMobile: Story = { args: { mode: 'sign-up' }, globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const Recovery: Story = { args: { mode: 'recovery' } }
export const RecoveryMobile: Story = { args: { mode: 'recovery' }, globals: { viewport: { value: 'mobile2', isRotated: false } } }
