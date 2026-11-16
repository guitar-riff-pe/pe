import { readDraft, type RiffDraft } from './composing.ts'

export const roundDraftKey = (playerId: string, roundId: string) =>
  `riff-battle.riff-draft.${playerId}.${roundId}`

// A draft based on an older server revision must not overwrite a newer saved riff.
export function readRoundDraft(value: string | null, bars: number, revision: string | null): RiffDraft | null {
  try {
    if (!value) return null
    const stored = JSON.parse(value)
    if (stored.revision !== revision) return null
    return readDraft(JSON.stringify(stored.draft), bars)
  } catch { return null }
}

export function serializeRoundDraft(draft: RiffDraft, revision: string | null): string {
  return JSON.stringify({ revision, draft })
}
