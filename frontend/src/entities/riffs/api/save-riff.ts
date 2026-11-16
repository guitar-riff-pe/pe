import { apiRequest } from '@shared/api'
import type { RiffPayload, SavedRiff } from '../model/riff-payload'

export function saveRiff(roundId: string, payload: RiffPayload, signal?: AbortSignal) {
  return apiRequest<SavedRiff>(`/rounds/${encodeURIComponent(roundId)}/riff`, {
    method: 'PUT', signal, body: JSON.stringify(payload),
  })
}
