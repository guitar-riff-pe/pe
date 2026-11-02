import { createFileRoute } from '@tanstack/react-router'
import { ResultsPage } from '@pages/results'

export const Route = createFileRoute('/rooms_/results')({ component: ResultsPage })
