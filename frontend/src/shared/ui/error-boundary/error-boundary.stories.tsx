import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { useState } from 'react'
import { Button } from '../button/button'
import { ErrorBoundary } from './error-boundary'

function Content({ fail }: { fail: boolean }) {
  if (fail) throw new Error('Network Error')
  return <p role="status">Раздел снова работает</p>
}

function Example() {
  const [fail, setFail] = useState(true)
  const [page, setPage] = useState('first')
  return <>
    <Button variant="secondary" onClick={() => { setFail(false); setPage('second') }}>Перейти в другой раздел</Button>
    <ErrorBoundary resetKey={page} onReset={() => setFail(false)}>
      <Content fail={fail} />
    </ErrorBoundary>
  </>
}

const meta = { title: 'Shared/ErrorBoundary', component: Example } satisfies Meta<typeof Example>
export default meta
type Story = StoryObj<typeof meta>
export const Recovery: Story = {}
