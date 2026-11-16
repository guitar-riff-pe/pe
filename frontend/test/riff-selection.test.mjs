import assert from 'node:assert/strict'
import test from 'node:test'
import { notesInRectangle, selectionRectangle } from '../src/features/edit-riff/lib/marquee-selection.ts'
import { createEditorState, editorReducer } from '../src/features/edit-riff/model/editor-state.ts'

const notes = [
  { id: 'a', pitch: 64, start: 240, duration: 480, velocity: 0.8 },
  { id: 'b', pitch: 76, start: 960, duration: 480, velocity: 0.8 },
]

test('rectangle selection works in all four drag directions and includes partial overlaps', () => {
  const corners = [
    [{ x: 700, y: 250 }, { x: 1000, y: 490 }],
    [{ x: 1000, y: 490 }, { x: 700, y: 250 }],
    [{ x: 700, y: 490 }, { x: 1000, y: 250 }],
    [{ x: 1000, y: 250 }, { x: 700, y: 490 }],
  ]
  for (const [start, end] of corners) {
    const rectangle = selectionRectangle(start, end)
    assert.deepEqual(rectangle, { x: 700, y: 250, width: 300, height: 240 })
    assert.deepEqual(notesInRectangle(notes, rectangle, 7680, 20), ['a', 'b'])
  }
})

test('zero-area and merely touching rectangles do not select tiles', () => {
  assert.deepEqual(notesInRectangle(notes, { x: 300, y: 480, width: 0, height: 20 }, 7680, 20), [])
  assert.deepEqual(notesInRectangle(notes, { x: 719, y: 480, width: 20, height: 20 }, 7680, 20), [])
})

test('hit testing uses zoomed content coordinates', () => {
  const normal = notesInRectangle(notes, { x: 700, y: 250, width: 300, height: 240 }, 7680, 20)
  const zoomed = notesInRectangle(notes, { x: 1400, y: 500, width: 600, height: 480 }, 15360, 40)
  assert.deepEqual(zoomed, normal)
})

test('selection previews lock edits, deduplicate IDs and commit without musical history', () => {
  let state = createEditorState(notes)
  state = editorReducer(state, { type: 'begin-selection' })
  state = editorReducer(state, { type: 'select-many', noteIds: ['a', 'a', 'b', 'missing'] })
  assert.deepEqual(state.selectedIds, ['a', 'b'])
  assert.equal(editorReducer(state, { type: 'nudge', ticks: 120, pitch: 1 }), state)
  assert.equal(editorReducer(state, { type: 'preview-move', ticks: 120, pitch: 1 }), state)
  state = editorReducer(state, { type: 'commit' })
  assert.deepEqual(state.notes, notes)
  assert.deepEqual(state.selectedIds, ['a', 'b'])
  assert.equal(state.gesture, null)
  assert.equal(state.past.length, 0)
})

test('cancel restores the selection from before the rectangle gesture', () => {
  let state = createEditorState(notes)
  state = editorReducer(state, { type: 'select', noteId: 'b' })
  state = editorReducer(state, { type: 'begin-selection' })
  state = editorReducer(state, { type: 'select-many', noteIds: ['b', 'a'] })
  state = editorReducer(state, { type: 'cancel' })
  assert.deepEqual(state.selectedIds, ['b'])
  assert.deepEqual(state.notes, notes)
  assert.equal(state.past.length, 0)
})

test('unchanged selection reuses state and deleting the selected group is one undoable edit', () => {
  let state = createEditorState(notes)
  state = editorReducer(state, { type: 'begin-selection' })
  state = editorReducer(state, { type: 'select-many', noteIds: ['a', 'b'] })
  assert.equal(editorReducer(state, { type: 'select-many', noteIds: ['a', 'b'] }), state)
  state = editorReducer(state, { type: 'commit' })
  state = editorReducer(state, { type: 'delete' })
  assert.equal(state.past.length, 1)
  assert.deepEqual(editorReducer(state, { type: 'undo' }).notes, notes)
})
