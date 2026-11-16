import assert from 'node:assert/strict'
import test from 'node:test'
import { toLobbyRoom, normalizeRoomCode, validRoomCode } from '../src/entities/rooms/model/room-record.ts'
import { safeReturnTo } from '../src/shared/lib/navigation/index.ts'
import { validateRoomName } from '../src/features/create-room/model/room-draft.ts'

test('lobby adapter preserves roles, marks the current player and fills empty places', () => {
  const room = { id: 'room', name: 'Garage', code: 'ABC123', capacity: 4, bars: 8, bpm: 155,
    members: [{ id: 'a', nickname: 'Host', is_host: true }, { id: 'b', nickname: 'Guest', is_host: false }] }
  const lobby = toLobbyRoom(room, 'b')
  assert.equal(lobby.participants.length, 4)
  assert.equal(lobby.participants[0].role, 'host')
  assert.equal(lobby.participants[0].isSelf, false)
  assert.equal(lobby.participants[1].isSelf, true)
  assert.deepEqual(lobby.participants.slice(2).map(member => member.role), ['empty', 'empty'])
  assert.equal(new Set(lobby.participants.map(member => member.id)).size, 4)
  assert.equal(lobby.bars, 8)
  assert.equal(lobby.bpm, 155)
  assert.equal(toLobbyRoom({ ...room, bars: null }, 'b').bars, null)
})

test('room names use the same 3–40 character bounds as the server', () => {
  assert.ok(validateRoomName('  '))
  assert.ok(validateRoomName('🎸🎸'))
  assert.equal(validateRoomName('  Garage  '), undefined)
  assert.equal(validateRoomName('a'.repeat(40)), undefined)
  assert.ok(validateRoomName('a'.repeat(41)))
})

test('invitation code normalizes case and rejects malformed codes before calling the API', () => {
  assert.equal(normalizeRoomCode(' x7k2m9 '), 'X7K2M9')
  assert.equal(validRoomCode(' x7k2m9 '), true)
  for (const value of ['', 'abc', 'a'.repeat(9), 'ABC DEF', '<room>', 'КОМНАТА']) assert.equal(validRoomCode(value), false)
})

test('authentication return links preserve invitations and reject external or unknown destinations', () => {
  assert.equal(safeReturnTo('/rooms?code=ABC123'), '/rooms?code=ABC123')
  assert.equal(safeReturnTo('/rooms/create'), '/rooms/create')
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/login', '/unknown', 'javascript:alert(1)', undefined]) assert.equal(safeReturnTo(value), undefined)
})
