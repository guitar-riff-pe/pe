import type { RiffNote } from '@entities/riffs'
import { constrainNote, SNAP_TICKS, TOTAL_TICKS, translateSelection } from '../lib/editor-geometry.ts'
import { MAX_NOTES } from '../lib/note-limit.ts'

type Gesture = { before: RiffNote[]; beforeSelection: string[]; noteId: string | null }
export type EditorState = {
  totalTicks: number
  notes: RiffNote[]
  selectedIds: string[]
  past: RiffNote[][]
  future: RiffNote[][]
  gesture: Gesture | null
  lastDuration: number
}

export type EditorAction =
  | { type: 'begin'; noteId: string }
  | { type: 'create'; note: RiffNote }
  | { type: 'preview'; note: RiffNote }
  | { type: 'preview-notes'; notes: RiffNote[] }
  | { type: 'update'; note: RiffNote }
  | { type: 'select'; noteId: string | null; additive?: boolean }
  | { type: 'select-many'; noteIds: readonly string[] }
  | { type: 'nudge' | 'preview-move'; ticks: number; pitch: number }
  | { type: 'commit' | 'cancel' | 'delete' | 'undo' | 'redo' | 'select-all' | 'begin-selection' }

export function createEditorState(notes: readonly RiffNote[] = [], totalTicks = TOTAL_TICKS): EditorState {
  const ids = new Set<string>()
  for (const note of notes) {
    if (!note.id || ids.has(note.id) || ![note.pitch, note.start, note.duration, note.velocity].every(Number.isFinite)) {
      throw new Error('Notes must have unique IDs and finite musical values')
    }
    ids.add(note.id)
  }
  return { totalTicks, notes: notes.map(note => constrainNote(note, totalTicks)), selectedIds: [], past: [], future: [], gesture: null, lastDuration: SNAP_TICKS }
}

const sameNotes = (a: RiffNote[], b: RiffNote[]) => a.length === b.length && a.every((note, index) => {
  const other = b[index]
  return note.id === other.id && note.pitch === other.pitch && note.start === other.start &&
    note.duration === other.duration && note.velocity === other.velocity
})

// A bounded history stores committed musical data; pointer previews never enter it.
function record(state: EditorState, before: RiffNote[]): EditorState {
  return { ...state, past: [...state.past, before].slice(-100), future: [], gesture: null }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'update': {
      if (state.gesture || !state.notes.some(note => note.id === action.note.id)) return state
      const notes = state.notes.map(note => note.id === action.note.id ? constrainNote(action.note, state.totalTicks) : note)
      return sameNotes(notes, state.notes) ? state : { ...record(state, state.notes), notes }
    }
    case 'begin-selection':
      return state.gesture ? state : {
        ...state, gesture: { before: state.notes, beforeSelection: state.selectedIds, noteId: null },
      }
    case 'begin':
      return state.gesture || !state.notes.some(note => note.id === action.noteId) ? state : {
        ...state, selectedIds: state.selectedIds.includes(action.noteId) ? state.selectedIds : [action.noteId],
        gesture: { before: state.notes, beforeSelection: state.selectedIds, noteId: action.noteId },
      }
    case 'create': {
      if (state.gesture || state.notes.some(note => note.id === action.note.id)) return state
      if (state.notes.length >= MAX_NOTES) return state
      const note = constrainNote(action.note, state.totalTicks)
      return { ...state, notes: [...state.notes, note], selectedIds: [note.id],
        gesture: { before: state.notes, beforeSelection: state.selectedIds, noteId: note.id } }
    }
    case 'preview': {
      if (!state.gesture || action.note.id !== state.gesture.noteId) return state
      const notes = state.notes.map(note => note.id === action.note.id ? constrainNote(action.note, state.totalTicks) : note)
      return sameNotes(notes, state.notes) ? state : { ...state, notes }
    }
    case 'preview-notes':
      return !state.gesture || state.gesture.noteId === null || sameNotes(action.notes, state.notes)
        ? state : { ...state, notes: action.notes }
    case 'preview-move': {
      if (!state.gesture || state.gesture.noteId === null) return state
      const notes = translateSelection(state.gesture.before, state.selectedIds, action.ticks, action.pitch, state.totalTicks)
      return sameNotes(notes, state.notes) ? state : { ...state, notes }
    }
    case 'nudge': {
      if (state.gesture) return state
      const notes = translateSelection(state.notes, state.selectedIds, action.ticks, action.pitch, state.totalTicks)
      return notes === state.notes ? state : { ...record(state, state.notes), notes }
    }
    case 'commit': {
      if (!state.gesture) return state
      if (sameNotes(state.notes, state.gesture.before)) return { ...state, notes: state.gesture.before, gesture: null }
      const duration = state.notes.find(note => note.id === state.gesture?.noteId)?.duration ?? state.lastDuration
      return { ...record(state, state.gesture.before), lastDuration: duration }
    }
    case 'cancel':
      return !state.gesture ? state : {
        ...state, notes: state.gesture.before, gesture: null,
        selectedIds: state.gesture.beforeSelection,
      }
    case 'select': {
      if (state.gesture) return state
      const id = action.noteId
      if (!id || !state.notes.some(note => note.id === id)) return action.additive ? state : { ...state, selectedIds: [] }
      const selectedIds = !action.additive ? [id] : state.selectedIds.includes(id)
        ? state.selectedIds.filter(selectedId => selectedId !== id) : [...state.selectedIds, id]
      return { ...state, selectedIds }
    }
    case 'select-all':
      return state.gesture ? state : { ...state, selectedIds: state.notes.map(note => note.id) }
    case 'select-many': {
      if (state.gesture && state.gesture.noteId !== null) return state
      const validIds = new Set(state.notes.map(note => note.id))
      const selectedIds = [...new Set(action.noteIds)].filter(id => validIds.has(id))
      if (selectedIds.length === state.selectedIds.length && selectedIds.every((id, index) => id === state.selectedIds[index])) return state
      return { ...state, selectedIds }
    }
    case 'delete': {
      if (state.gesture || !state.selectedIds.length) return state
      return { ...record(state, state.notes), notes: state.notes.filter(note => !state.selectedIds.includes(note.id)), selectedIds: [] }
    }
    case 'undo': {
      const notes = state.past.at(-1)
      if (state.gesture || !notes) return state
      return { ...state, notes, past: state.past.slice(0, -1), future: [...state.future, state.notes],
        selectedIds: state.selectedIds.filter(id => notes.some(note => note.id === id)) }
    }
    case 'redo': {
      const notes = state.future.at(-1)
      if (state.gesture || !notes) return state
      return { ...state, notes, past: [...state.past, state.notes], future: state.future.slice(0, -1),
        selectedIds: state.selectedIds.filter(id => notes.some(note => note.id === id)) }
    }
  }
}
