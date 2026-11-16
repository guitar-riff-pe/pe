import type { KeyboardEvent, RefObject } from 'react'
import type { RiffNote } from '@entities/riffs'
import type { RiffEditorController } from './use-riff-editor'
import type { PointerGesture } from './pointer-gesture'
import { SNAP_TICKS, translateSelection } from '../lib/editor-geometry'

type Options = {
  editor: RiffEditorController
  gesture: RefObject<PointerGesture | null>
  finish: (commit: boolean) => void
  readOnly: boolean
  onAudition?: (note: RiffNote) => void
}

export function usePianoRollKeyboard({ editor, gesture, finish, readOnly, onAudition }: Options) {
  const { state, dispatch } = editor
  const totalTicks = state.totalTicks
  return (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase()
    const command = event.ctrlKey || event.metaKey
    const code = event.code
    if (event.altKey) return
    if (readOnly) {
      if (command || event.shiftKey || ['delete', 'backspace'].includes(key)) event.preventDefault()
      return
    }
    if (key === 'escape') { event.preventDefault(); finish(false); return }
    if (command && (code === 'KeyA' || key === 'a')) {
      event.preventDefault()
      if (!gesture.current) dispatch({ type: 'select-all' })
    } else if (command && (code === 'KeyZ' || code === 'KeyY' || key === 'z' || key === 'y')) {
      event.preventDefault()
      finish(false)
      dispatch({ type: code === 'KeyY' || key === 'y' || event.shiftKey ? 'redo' : 'undo' })
    } else if ((event.shiftKey && !command && (key === 'arrowleft' || key === 'arrowright')) ||
      ((event.shiftKey || command) && (key === 'arrowup' || key === 'arrowdown'))) {
      event.preventDefault()
      if (!gesture.current) {
        const ticks = key === 'arrowleft' ? -SNAP_TICKS : key === 'arrowright' ? SNAP_TICKS : 0
        const pitch = key === 'arrowup' ? command ? 12 : 1 : key === 'arrowdown' ? command ? -12 : -1 : 0
        const notes = translateSelection(state.notes, state.selectedIds, ticks, pitch, totalTicks)
        const lead = notes.find(note => state.selectedIds.includes(note.id))
        if (pitch && lead && notes !== state.notes) onAudition?.(lead)
        dispatch({ type: 'nudge', ticks, pitch })
      }
    } else if (key === 'delete' || key === 'backspace') {
      event.preventDefault()
      if (!gesture.current) dispatch({ type: 'delete' })
    }
  }

}
