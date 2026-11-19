import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { createRootRoute, createRoute } from '@tanstack/react-router'
import { AuthPage } from './auth-page'

const root = createRootRoute()
const login = createRoute({ getParentRoute: () => root, path: '/login' })
root.addChildren([login, createRoute({ getParentRoute: () => root, path: '/rooms', component: () => <main><h1>Комнаты</h1></main> })])

const meta = {
  title: 'Pages/Auth',
  component: AuthPage,
  args: { mode: 'sign-in' },
  parameters: { layout: 'fullscreen', mockSession: false, tanstack: { router: { route: login, path: '/login' } } },
} satisfies Meta<typeof AuthPage>

export default meta
type Story = StoryObj<typeof meta>

export const SignIn: Story = {}
export const SignInMobile: Story = { globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const SignUp: Story = { args: { mode: 'sign-up' } }
export const SignUpMobile: Story = { args: { mode: 'sign-up' }, globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const Recovery: Story = { args: { mode: 'recovery' } }
export const RecoveryMobile: Story = { args: { mode: 'recovery' }, globals: { viewport: { value: 'mobile2', isRotated: false } } }
export const ResetPassword: Story = { args: { mode: 'reset-password', resetToken: 'storybook-reset-token' } }
