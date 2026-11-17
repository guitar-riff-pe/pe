type RankedRiff = { id: string; votes: number | null; author_nickname: string | null }

export function rankRiffs(riffs: readonly RankedRiff[]) {
  const scores = riffs.map((riff, index) => ({ ...riff, votes: riff.votes ?? 0, riff: `Рифф ${String.fromCharCode(65 + index)}` }))
    .sort((a, b) => b.votes - a.votes)
  let place = 1
  return scores.map((riff, index) => {
    if (index > 0 && riff.votes !== scores[index - 1].votes) place = index + 1
    return { id: riff.id, place,
      player: riff.author_nickname ?? 'Игрок', votes: riff.votes, riff: riff.riff,
    }
  })
}
