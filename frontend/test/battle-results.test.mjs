import assert from 'node:assert/strict'
import test from 'node:test'
import { rankRiffs } from '../src/pages/results/model/rank-riffs.ts'
import { formatProfile } from '../src/entities/profiles/model/format-profile.ts'

test('ranking preserves every tied winner, original anonymous labels and skipped places', () => {
  const result = rankRiffs([
    { id: 'a', votes: 0, author_nickname: 'A' },
    { id: 'b', votes: 2, author_nickname: 'B' },
    { id: 'c', votes: 2, author_nickname: 'C' },
  ])
  assert.deepEqual(result.map(item => [item.id, item.place, item.riff]), [['b', 1, 'Рифф B'], ['c', 1, 'Рифф C'], ['a', 3, 'Рифф A']])
})

test('zero votes means a shared first place; an empty round has no winners', () => {
  assert.deepEqual(rankRiffs([]), [])
  assert.deepEqual(rankRiffs([{ id: 'a', votes: 0, author_nickname: 'A' }, { id: 'b', votes: 0, author_nickname: 'B' }]).map(item => item.place), [1, 1])
})

test('ranking preserves stable ties across multiple groups without mutating input', () => {
  const votes = [null, 4, 2, 4, 2, 1]
  const input = votes.map((votes, index) => Object.freeze({ id: String(index), votes, author_nickname: null }))
  Object.freeze(input)
  const ranked = rankRiffs(input)
  assert.deepEqual(ranked.map(item => [item.id, item.place]), [['1', 1], ['3', 1], ['2', 3], ['4', 3], ['5', 5], ['0', 6]])
  assert.deepEqual(input.map(item => item.votes), votes)
})

test('profile dates use UTC, preserve history IDs and handle an empty best round', () => {
  const record = { name: 'A', handle: '@aaa', joined: '2026-10-01T00:00:00Z', battles: 1, wins: 1, votes: 2,
    weeklyBattles: [0, 1], weekStarts: ['2026-10-12', '2026-10-19'], bestRound: null,
    history: [{ id: 'round-id', title: 'Garage', date: '2026-10-20T00:00:00Z', place: 1, votes: 2 }],
  }
  const result = formatProfile(record)
  assert.match(result.joined, /октябрь 2026/)
  assert.match(result.history[0].date, /20 октября 2026/)
  assert.equal(result.history[0].id, 'round-id')
  assert.equal(result.bestRound, null)
  assert.equal(record.joined, '2026-10-01T00:00:00Z')
})
