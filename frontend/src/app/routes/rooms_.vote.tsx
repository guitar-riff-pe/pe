import { createFileRoute } from '@tanstack/react-router'
import { VotingPage } from '@pages/voting'

export const Route = createFileRoute('/rooms_/vote')({ component: VotingPage })
