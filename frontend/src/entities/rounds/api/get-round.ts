import { apiRequest } from '@shared/api'
import type { RoundData } from '../model/round'

export function getRound(roundId: string, signal?: AbortSignal) {
  return apiRequest<RoundData>(`/rounds/${encodeURIComponent(roundId)}`, { signal })
}

export function castVote(roundId: string, riffId: string) {
  return apiRequest<{ riff_id: string }>(`/rounds/${encodeURIComponent(roundId)}/votes`, {
    method: 'POST', body: JSON.stringify({ riff_id: riffId }),
  })
}
