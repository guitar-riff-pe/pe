import assert from 'node:assert/strict'
import test from 'node:test'
import { createEditorState, editorReducer } from '../src/features/edit-riff/model/editor-state.ts'
import { moveNote, resizeNote, TOTAL_TICKS, SNAP_TICKS } from '../src/features/edit-riff/lib/editor-geometry.ts'
import { zoomViewport } from '../src/features/edit-riff/lib/zoom-viewport.ts'

const note = { id: 'a', pitch: 64, start: 240, duration: 480, velocity: 0.8 }
const apply = (state, action) => editorReducer(state, action)

test('many pointer previews become one undoable gesture, with redo', () => {
  let state = createEditorState([note])
  state = apply(state, { type: 'begin', noteId: note.id })
  for (const delta of [120, 240, 360, 480]) state = apply(state, { type: 'preview', note: moveNote(note, delta, 2) })
  assert.equal(state.past.length, 0)
  state = apply(state, { type: 'commit' })
  assert.equal(state.past.length, 1)
  assert.equal(state.notes[0].start, 720)
  state = apply(state, { type: 'undo' })
  assert.deepEqual(state.notes, [note])
  assert.equal(apply(state, { type: 'redo' }).notes[0].pitch, 66)
})

test('Escape restores the original note and preserves redo history', () => {
  let state = createEditorState([note])
  state = apply(state, { type: 'select', noteId: 'a' })
  state = apply(state, { type: 'delete' })
  state = apply(state, { type: 'undo' })
  state = apply(state, { type: 'begin', noteId: 'a' })
  state = apply(state, { type: 'preview', note: resizeNote(note, 600) })
  state = apply(state, { type: 'cancel' })
  assert.deepEqual(state.notes, [note])
  assert.equal(state.future.length, 1)
  assert.deepEqual(apply(state, { type: 'redo' }).notes, [])
})

test('a cancelled new note does not leave a note or history entry', () => {
  let state = createEditorState()
  state = apply(state, { type: 'create', note })
  state = apply(state, { type: 'cancel' })
  assert.deepEqual(state.notes, [])
  assert.deepEqual(state.selectedIds, [])
  assert.equal(state.past.length, 0)
})

test('selecting a note without moving it does not consume undo or invalidate redo', () => {
  let state = createEditorState([note])
  state = apply(state, { type: 'begin', noteId: 'a' })
  state = apply(state, { type: 'preview', note: { ...note } })
  state = apply(state, { type: 'commit' })
  assert.equal(state.past.length, 0)
  assert.deepEqual(state.selectedIds, ['a'])
})

test('moving snaps to sixteenths and clamps pitch and time while preserving duration', () => {
  const low = moveNote(note, -10000, -100)
  const high = moveNote(note, 10000, 100)
  assert.equal(low.start, 0)
  assert.equal(low.pitch, 40)
  assert.equal(high.pitch, 88)
  assert.equal(high.start + high.duration, TOTAL_TICKS)
  assert.equal(high.duration, note.duration)
  assert.equal(moveNote(note, 180, 0).start, note.start + 240)
})

test('resizing keeps the left edge fixed, limits duration and remembers the committed length', () => {
  assert.equal(resizeNote(note, -10000).duration, SNAP_TICKS)
  const long = resizeNote(note, 10000)
  assert.equal(long.start, note.start)
  assert.equal(long.start + long.duration, TOTAL_TICKS)
  let state = apply(createEditorState([note]), { type: 'begin', noteId: 'a' })
  state = apply(state, { type: 'preview', note: resizeNote(note, 120) })
  state = apply(state, { type: 'commit' })
  assert.equal(state.lastDuration, 600)
})

test('a new edit after undo discards the old redo branch', () => {
  let state = createEditorState([note])
  state = apply(state, { type: 'select', noteId: 'a' })
  state = apply(state, { type: 'delete' })
  state = apply(state, { type: 'undo' })
  state = apply(state, { type: 'create', note: { ...note, id: 'b' } })
  state = apply(state, { type: 'commit' })
  assert.equal(state.future.length, 0)
  assert.equal(state.notes.length, 2)
})

test('initial data rejects duplicate IDs and non-finite positions', () => {
  assert.throws(() => createEditorState([note, note]), /unique IDs/)
  assert.throws(() => createEditorState([{ ...note, start: NaN }]), /finite/)
})

const other = { ...note, id: 'b', pitch: 76, start: 960 }

test('additive selection toggles notes; select-all and selection changes do not enter history', () => {
  let state = createEditorState([note, other])
  state = apply(state, { type: 'select', noteId: 'a', additive: true })
  state = apply(state, { type: 'select', noteId: 'b', additive: true })
  assert.deepEqual(state.selectedIds, ['a', 'b'])
  state = apply(state, { type: 'select', noteId: 'a', additive: true })
  assert.deepEqual(state.selectedIds, ['b'])
  state = apply(state, { type: 'select-all' })
  assert.deepEqual(state.selectedIds, ['a', 'b'])
  assert.equal(state.past.length, 0)
})

test('nudging a selection moves only selected notes and is undone as one edit', () => {
  let state = apply(createEditorState([note, other]), { type: 'select', noteId: 'a' })
  state = apply(state, { type: 'nudge', ticks: SNAP_TICKS, pitch: 1 })
  assert.equal(state.notes[0].start, note.start + SNAP_TICKS)
  assert.equal(state.notes[0].pitch, note.pitch + 1)
  assert.deepEqual(state.notes[1], other)
  assert.deepEqual(apply(state, { type: 'undo' }).notes, [note, other])
})

test('group nudges clamp the shared delta, preserving spacing at pitch and time edges', () => {
  let state = apply(createEditorState([note, other]), { type: 'select-all' })
  state = apply(state, { type: 'nudge', ticks: -10000, pitch: 100 })
  assert.equal(state.notes[0].start, 0)
  assert.equal(state.notes[1].start - state.notes[0].start, other.start - note.start)
  assert.equal(state.notes[1].pitch, 88)
  assert.equal(state.notes[1].pitch - state.notes[0].pitch, other.pitch - note.pitch)
  const before = state
  state = apply(state, { type: 'nudge', ticks: 0, pitch: 12 })
  assert.equal(state, before, 'blocked nudge must not consume undo history')
})

test('group dragging previews from the original data and cancellation restores selection', () => {
  let state = apply(createEditorState([note, other]), { type: 'select-all' })
  state = apply(state, { type: 'begin', noteId: 'a' })
  state = apply(state, { type: 'preview-move', ticks: 120, pitch: 1 })
  state = apply(state, { type: 'preview-move', ticks: 240, pitch: 2 })
  assert.equal(state.notes[1].start, other.start + 240)
  state = apply(state, { type: 'cancel' })
  assert.deepEqual(state.notes, [note, other])
  assert.deepEqual(state.selectedIds, ['a', 'b'])
  assert.equal(state.past.length, 0)
})

test('deleting all selected notes is one undoable edit', () => {
  let state = apply(createEditorState([note, other]), { type: 'select-all' })
  state = apply(state, { type: 'delete' })
  assert.deepEqual(state.notes, [])
  assert.equal(state.past.length, 1)
  assert.deepEqual(apply(state, { type: 'undo' }).notes, [note, other])
})

test('zoom preserves the content point under the cursor and clamps viewport offsets', () => {
  const view = { scale: 1, left: 0, top: 200, width: 1000, contentHeight: 980, heightLimit: 480, x: 400, y: 200, delta: -200 }
  const next = zoomViewport(view)
  assert.ok(next.scale > 1)
  assert.ok(Math.abs((next.left + view.x) / next.scale - (view.left + view.x)) < 0.001)
  assert.ok(Math.abs((next.top + view.y) / next.scale - (view.top + view.y)) < 0.001)
  const min = zoomViewport({ ...view, delta: 10000 })
  assert.equal(min.scale, 0.5)
  assert.equal(min.left, 0)
  assert.ok(min.top >= 0 && min.top <= 10)
  assert.equal(zoomViewport({ ...view, delta: -10000 }).scale, 4)
})
