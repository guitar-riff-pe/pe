import assert from 'node:assert/strict'
import test from 'node:test'
import { createDraftPersistence } from '../src/pages/create-riff/model/draft-persistence.ts'
import { parseRoomSearch } from '../src/features/filter-rooms/model/room-search.ts'
import { createEditorState, editorReducer } from '../src/features/edit-riff/model/editor-state.ts'

test('draft writes coalesce and navigation flushes the latest snapshot only once', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const writes = []
  const storage = createDraftPersistence(value => writes.push(value), () => {})
  storage.schedule('first')
  t.mock.timers.tick(200)
  storage.schedule('latest')
  t.mock.timers.tick(200)
  assert.deepEqual(writes, [])
  storage.flush(false)
  t.mock.timers.tick(500)
  assert.deepEqual(writes, ['latest'])
  storage.schedule('latest')
  t.mock.timers.tick(300)
  assert.deepEqual(writes, ['latest'])
})

test('failed draft writes report an error and can retry without losing the draft', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let fail = true
  const writes = [], errors = []
  const storage = createDraftPersistence(value => {
    if (fail) throw new Error('quota')
    writes.push(value)
  }, error => errors.push(error))
  storage.schedule('draft')
  t.mock.timers.tick(300)
  assert.ok(errors[0])
  fail = false
  storage.flush()
  assert.deepEqual(writes, ['draft'])
  assert.equal(errors.at(-1), '')
})

test('room search preserves invitation and filters through a URL round trip', () => {
  const value = { code: 'abc123', query: 'Мой грув', style: 'Metal', onlyAvailable: true }
  const search = parseRoomSearch(Object.fromEntries(new URLSearchParams(value)))
  assert.deepEqual(search, { ...value, code: 'ABC123' })
  assert.deepEqual(parseRoomSearch({ query: [], style: 'unknown', onlyAvailable: 'false' }), {
    code: undefined, query: undefined, style: undefined, onlyAvailable: undefined,
  })
})

test('editing note parameters is one undoable change and preserves other notes', () => {
  const note = { id: 'a', pitch: 64, start: 0, duration: 120, velocity: 0.8 }
  const other = { ...note, id: 'b' }
  let state = createEditorState([note, other])
  state = editorReducer(state, { type: 'update', note: { ...note, pitch: 67, start: 480, duration: 240, velocity: 0.5 } })
  assert.equal(state.past.length, 1)
  assert.deepEqual(state.notes[1], other)
  const updated = state.notes
  state = editorReducer(state, { type: 'undo' })
  assert.deepEqual(state.notes, [note, other])
  state = editorReducer(state, { type: 'redo' })
  assert.deepEqual(state.notes, updated)
  assert.equal(editorReducer(state, { type: 'update', note: updated[0] }), state)
})

test('pointer previews preserve state identity inside the same snapped cell and at bounds', () => {
  const note = { id: 'a', pitch: 64, start: 0, duration: 120, velocity: 0.8 }
  let state = editorReducer(createEditorState([note]), { type: 'begin', noteId: 'a' })
  assert.equal(editorReducer(state, { type: 'preview-move', ticks: 10, pitch: 0 }), state)
  assert.equal(editorReducer(state, { type: 'preview', note: { ...note, duration: 125 } }), state)
  state = editorReducer(state, { type: 'preview-move', ticks: 125, pitch: 0 })
  assert.equal(editorReducer(state, { type: 'preview-move', ticks: 130, pitch: 0 }), state)
  assert.equal(editorReducer(state, { type: 'preview-notes', notes: state.notes.map(note => ({ ...note })) }), state)
  state = editorReducer(state, { type: 'preview-move', ticks: -100, pitch: 0 })
  assert.equal(editorReducer(state, { type: 'preview-move', ticks: -1000, pitch: 0 }), state)
  assert.deepEqual(editorReducer(state, { type: 'cancel' }).notes, [note])
})
