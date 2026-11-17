import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeNotes, encodeRiff, RIFF_TICKS_PER_BEAT } from '../src/entities/riffs/model/riff-payload.ts'
import { formatCountdown, readDraft, remainingSeconds } from '../src/pages/create-riff/model/composing.ts'
import { createEditorState, editorReducer } from '../src/features/edit-riff/model/editor-state.ts'
import { noteAtPoint, resizeNote, TICKS_PER_BEAT } from '../src/features/edit-riff/lib/editor-geometry.ts'
import { notesInRectangle } from '../src/features/edit-riff/lib/marquee-selection.ts'
import { scheduleRiff } from '../src/features/play-riff/lib/riff-schedule.ts'
import { createServerClock } from '../src/shared/lib/countdown/clock.ts'
import { readRoundDraft, roundDraftKey, serializeRoundDraft } from '../src/pages/create-riff/model/round-draft.ts'

const note = { id: 'late', pitch: 66, start: 13440, duration: 480, velocity: 100 / 127 }

test('live drafts are isolated per player and round and reject stale server revisions', () => {
  const draft = { notes: [note], timbre: 'clean' }
  const stored = serializeRoundDraft(draft, 'revision-1')
  assert.deepEqual(readRoundDraft(stored, 8, 'revision-1'), draft)
  assert.equal(readRoundDraft(stored, 8, 'revision-2'), null)
  assert.equal(readRoundDraft(stored, 4, 'revision-1'), null)
  assert.equal(readRoundDraft('null', 8, null), null)
  assert.notEqual(roundDraftKey('a', 'one'), roundDraftKey('b', 'one'))
  assert.notEqual(roundDraftKey('a', 'one'), roundDraftKey('a', 'two'))
})

test('server clock keeps its origin across repeated reads and expires without a render', () => {
  let now = 100
  const clock = createServerClock('2026-11-14T10:05:00Z', '2026-11-14T10:00:00Z', () => now)
  now += 120000
  assert.equal(clock(), 180)
  assert.equal(clock(), 180)
  now += 180001
  assert.equal(clock(), 0)
})

test('the API stores beat positions, ASCII pitches and MIDI velocities; round-trip preserves music', () => {
  assert.equal(RIFF_TICKS_PER_BEAT, TICKS_PER_BEAT)
  const payload = encodeRiff([note], 'distortion')
  assert.deepEqual(payload, { timbre: 'distortion', notes: [{ pitch: 'F#4', start: 28, duration: 1, velocity: 100 }] })
  const [decoded] = decodeNotes(payload.notes)
  assert.deepEqual({ ...decoded, id: note.id }, note)
  assert.equal(decodeNotes([{ ...payload.notes[0], pitch: 'Gb4' }])[0].pitch, 66)
  assert.throws(() => decodeNotes([{ ...payload.notes[0], pitch: 'F♯4' }]))
})

test('eight-bar notes survive init, selection, movement, resize, undo and audio scheduling', () => {
  const total = 8 * 4 * 480
  let state = createEditorState([note], total)
  assert.equal(state.notes[0].start, note.start)
  state = editorReducer(state, { type: 'select-all' })
  state = editorReducer(state, { type: 'nudge', ticks: 12000, pitch: 0 })
  assert.equal(state.notes[0].start + state.notes[0].duration, total)
  state = editorReducer(state, { type: 'undo' })
  assert.equal(state.notes[0].start, note.start)
  const resized = resizeNote(note, 12000, total)
  assert.equal(resized.start + resized.duration, total)
  assert.equal(noteAtPoint(state.notes, 13441 / total * 1000, (88 - 66) * 20 + 5, 1000, 20, total)?.id, 'late')
  assert.deepEqual(notesInRectangle(state.notes, { x: 870, y: 440, width: 60, height: 20 }, 1000, 20, total), ['late'])
  const schedule = scheduleRiff(state.notes, 300, { ticksPerBeat: 480, lengthTicks: total })
  assert.equal(schedule.duration, 6.4)
  assert.ok(Math.abs(schedule.events[0].time - 5.6) < 1e-10)
})

test('timer uses elapsed monotonic time against server timestamps and clamps at the deadline', () => {
  const now = '2026-11-14T10:00:00Z'
  const end = '2026-11-14T10:05:00Z'
  assert.equal(remainingSeconds(end, now, 0), 300)
  assert.equal(remainingSeconds(end, now, 1001), 299)
  assert.equal(remainingSeconds(end, now, 299999), 1)
  assert.equal(remainingSeconds(end, now, 300000), 0)
  assert.equal(remainingSeconds(end, now, 900000), 0)
  assert.equal(formatCountdown(272), '04:32')
  assert.equal(formatCountdown(0), '00:00')
})

test('local drafts are validated before mounting the editor', () => {
  const draft = { notes: [note], timbre: 'clean' }
  assert.deepEqual(readDraft(JSON.stringify(draft), 8), draft)
  assert.equal(readDraft(JSON.stringify(draft), 4), null)
  assert.equal(readDraft('bad JSON', 8), null)
  assert.equal(readDraft(JSON.stringify({ ...draft, notes: [note, note] }), 8), null)
  assert.equal(readDraft(JSON.stringify({ ...draft, timbre: 'unknown' }), 8), null)
  assert.equal(readDraft(JSON.stringify({ ...draft, notes: [{ ...note, pitch: 39 }] }), 8), null)
})

test('the editor enforces the backend limit without losing existing notes', () => {
  const notes = Array.from({ length: 512 }, (_, index) => ({ ...note, id: String(index), start: 0 }))
  const state = createEditorState(notes)
  assert.equal(editorReducer(state, { type: 'create', note: { ...note, id: 'overflow' } }), state)
})
