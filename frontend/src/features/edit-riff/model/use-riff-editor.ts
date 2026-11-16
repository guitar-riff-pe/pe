import { useEffect, useMemo, useReducer, useRef } from 'react'
import type { RiffNote } from '@entities/riffs'
import { createEditorState, editorReducer } from './editor-state'
import { TOTAL_TICKS } from '../lib/editor-geometry'

export function useRiffEditor(initialNotes: readonly RiffNote[] = [], onNotesChange?: (notes: readonly RiffNote[]) => void, totalTicks = TOTAL_TICKS) {
  const [state, dispatch] = useReducer(editorReducer, { initialNotes, totalTicks }, value => createEditorState(value.initialNotes, value.totalTicks))
  const published = useRef(state.notes)

  useEffect(() => {
    if (!state.gesture && published.current !== state.notes) {
      published.current = state.notes
      onNotesChange?.(state.notes)
    }
  }, [state.notes, state.gesture, onNotesChange])

  return useMemo(() => ({ state, dispatch }), [state])
}

export type RiffEditorController = ReturnType<typeof useRiffEditor>
