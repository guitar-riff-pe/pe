import type { SavedRiff, ApiNote, RiffTimbre } from '@entities/riffs/@x/rounds'

export type ComposingRound = {
  id: string
  room_id: string
  number: number
  stage: 'composing' | 'voting' | 'results'
  loop_title: string
  loop_url: string
  bpm: number
  bars: number
  composing_ends_at: string
  server_now: string
  own_riff: SavedRiff | null
}

export type RoundRiff = {
  id: string
  timbre: RiffTimbre
  notes: ApiNote[]
  is_own: boolean
  author_id: string | null
  author_nickname: string | null
  votes: number | null
  is_winner: boolean | null
}

export type RoundData = ComposingRound & {
  voting_ends_at: string
  riffs: RoundRiff[] | null
  your_vote_riff_id: string | null
  winner_ids: string[] | null
  votes_count: number
}
