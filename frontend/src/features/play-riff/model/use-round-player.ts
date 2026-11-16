import { useCallback, useMemo, useState } from 'react'
import { decodeNotes, type ApiNote, type RiffTimbre } from '@entities/riffs'
import { useRiffPlayback } from './use-riff-playback'

type Track = { id: string; notes: ApiNote[]; timbre: RiffTimbre }
export function useRoundPlayer(round: { bars: number; bpm: number; loop_url: string; riffs: Track[] | null }) {
  const timing = useMemo(() => ({ ticksPerBeat: 480, lengthTicks: round.bars * 4 * 480 }), [round.bars])
  const audio = useRiffPlayback(timing)
  const [selected, setSelected] = useState<string | null>(null)
  const playingId = audio.status === 'idle' ? null : selected
  const { stop, play: playAudio } = audio
  const play = useCallback((id: string) => {
    const track = round.riffs?.find(item => item.id === id)
    stop()
    if (!track || playingId === id) return
    setSelected(id)
    void playAudio(decodeNotes(track.notes), round.bpm, { timbre: track.timbre, backingUrl: round.loop_url })
  }, [round.riffs, round.bpm, round.loop_url, playingId, stop, playAudio])
  return { playingId, play, error: audio.error, loading: audio.status === 'loading' }
}
