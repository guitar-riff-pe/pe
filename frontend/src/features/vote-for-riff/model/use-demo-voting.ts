import { useState } from 'react'
import { useDemoRiffPlayer } from '@entities/riffs'

export function useDemoVoting(initialVote: string | null = 'b') {
  const [voteId, setVoteId] = useState<string | null>(initialVote)
  const [message, setMessage] = useState('')
  const player = useDemoRiffPlayer()

  function vote(id: string) {
    if (voteId !== null || id === 'own') return
    setVoteId(id)
    setMessage('Голос подтверждён за рифф ' + id.toUpperCase() + '. Изменить его нельзя.')
  }

  return { voteId, playingId: player.playingId, votesCount: voteId ? 2 : 1, message: player.error || message, play: player.play, stop: player.stop, vote }
}
