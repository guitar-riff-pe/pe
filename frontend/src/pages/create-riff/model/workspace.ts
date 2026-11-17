import type { ComposingRound } from '@entities/rounds'
import type { RiffPayload } from '@entities/riffs'
import type { RiffDraft } from './composing'

export type CreateRiffWorkspaceProps = {
  round?: ComposingRound
  initialDraft?: RiffDraft
  onSave?: (payload: RiffPayload, signal: AbortSignal) => Promise<void>
  storageKey?: string
}
