import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import type { RiffNote } from '@entities/riffs'
import type { RiffEditorController } from './use-riff-editor'
import { GRID_X, RULER_HEIGHT } from '../lib/piano-roll-layout'
import { clamp, HIGHEST_PITCH, noteAtPoint, resizeNote, snap, SNAP_TICKS, translateSelection } from '../lib/editor-geometry'
import { usePianoRollViewport } from './use-piano-roll-viewport'
import { usePianoRollKeyboard } from './use-piano-roll-keyboard'
import type { PointerGesture } from './pointer-gesture'
import { MAX_NOTES } from '../lib/note-limit'
import { notesInRectangle, selectionRectangle, type SelectionRectangle } from '../lib/marquee-selection'

type PianoRollInteractionOptions = {
  editor: RiffEditorController
  height?: number
  rowHeight?: number
  initialPitch?: number
  readOnly?: boolean
  onAudition?: (note: RiffNote) => void
}

export function usePianoRollInteraction({ editor, height = 480, rowHeight = 20, initialPitch = HIGHEST_PITCH, readOnly = false, onAudition }: PianoRollInteractionOptions) {
  const { state, dispatch } = editor
  const totalTicks = state.totalTicks
  const gesture = useRef<PointerGesture | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const [marquee, setMarquee] = useState<SelectionRectangle | null>(null)

  const finish = useCallback((commit: boolean) => {
    const active = gesture.current
    gesture.current = null
    dispatch({ type: commit ? 'commit' : 'cancel' })
    if (active?.mode === 'select') {
      setMarquee(null)
      if (commit && !active.dragging && active.hit) {
        dispatch({ type: 'select', noteId: active.hit.id, additive: true })
        onAudition?.(active.hit)
      }
    }
    if (active && host.current?.hasPointerCapture(active.pointerId)) host.current.releasePointerCapture(active.pointerId)
    if (host.current) host.current.style.cursor = 'crosshair'
  }, [dispatch, onAudition])

  const {
    scrollbar, horizontalScrollbar, width, viewportHeight, contentHeight,
    safeRowHeight, offset, left, contentWidth, viewportWidth, verticalScroll, horizontalScroll,
  } = usePianoRollViewport({ host, gesture, finish, height, rowHeight, initialPitch })
  const keyDown = usePianoRollKeyboard({ editor, gesture, finish, readOnly, onAudition })

  useEffect(() => {
    const cancel = () => finish(false)
    window.addEventListener('blur', cancel)
    return () => window.removeEventListener('blur', cancel)
  }, [finish])

  useEffect(() => {
    if (readOnly) finish(false)
  }, [readOnly, finish])

  const point = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - bounds.left - GRID_X + left, y: event.clientY - bounds.top - RULER_HEIGHT + offset }
  }

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (readOnly) return
    if (event.button !== 0 || !event.isPrimary || gesture.current) return
    const { x, y } = point(event)
    const gridWidth = contentWidth
    if (event.clientX - event.currentTarget.getBoundingClientRect().left < GRID_X || x < 0 || x >= gridWidth || y < 0 || y >= contentHeight || event.clientY - event.currentTarget.getBoundingClientRect().top < RULER_HEIGHT) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    const hit = noteAtPoint(state.notes, x, y, gridWidth, safeRowHeight, totalTicks)
    if (event.ctrlKey || event.metaKey) {
      gesture.current = { mode: 'select', pointerId: event.pointerId, x, y,
        clientX: event.clientX, clientY: event.clientY, beforeSelection: state.selectedIds, hit, dragging: false }
      dispatch({ type: 'begin-selection' })
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    if (!hit && state.notes.length >= MAX_NOTES) return
    const start = Math.floor(x / gridWidth * totalTicks / SNAP_TICKS) * SNAP_TICKS
    const note: RiffNote = hit ?? {
      id: crypto.randomUUID(), pitch: HIGHEST_PITCH - Math.floor(y / safeRowHeight), start,
      duration: Math.min(state.lastDuration, totalTicks - start), velocity: 0.8,
    }
    const right = (note.start + note.duration) / totalTicks * gridWidth
    const handle = Math.min(8, note.duration / totalTicks * gridWidth / 3)
    gesture.current = { pointerId: event.pointerId, mode: !hit ? 'create' : x >= right - handle ? 'resize' : 'move', x, y, gridWidth, note, auditionPitch: note.pitch,
      before: state.notes, selectedIds: hit && state.selectedIds.includes(hit.id) ? state.selectedIds : [note.id],
      lastTicks: 0, lastPitch: 0, lastDuration: note.duration }
    dispatch(hit ? { type: 'begin', noteId: hit.id } : { type: 'create', note })
    onAudition?.(note)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const { x, y } = point(event)
    const active = gesture.current
    if (active?.mode === 'select') {
      if (active.pointerId !== event.pointerId) return
      if (!active.dragging && Math.hypot(event.clientX - active.clientX, event.clientY - active.clientY) < 4) return
      active.dragging = true
      const rectangle = selectionRectangle(active, {
        x: clamp(x, left, Math.min(contentWidth, left + viewportWidth)),
        y: clamp(y, offset, Math.min(contentHeight, offset + viewportHeight)),
      })
      setMarquee(rectangle)
      dispatch({ type: 'select-many', noteIds: [
        ...active.beforeSelection, ...notesInRectangle(state.notes, rectangle, contentWidth, safeRowHeight, totalTicks),
      ] })
      event.currentTarget.style.cursor = 'crosshair'
      return
    }
    if (active) {
      if (active.pointerId !== event.pointerId || active.mode === 'create') return
      const deltaTicks = snap((x - active.x) / active.gridWidth * totalTicks)
      if (active.mode === 'resize') {
        const note = resizeNote(active.note, deltaTicks, totalTicks)
        if (note.duration === active.lastDuration) return
        active.lastDuration = note.duration
        dispatch({ type: 'preview', note })
      }
      else {
        const deltaPitch = -Math.round((y - active.y) / safeRowHeight)
        if (deltaTicks === active.lastTicks && deltaPitch === active.lastPitch) return
        active.lastTicks = deltaTicks; active.lastPitch = deltaPitch
        const notes = translateSelection(active.before, active.selectedIds, deltaTicks, deltaPitch, totalTicks)
        dispatch({ type: 'preview-notes', notes })
        const lead = notes.find(note => note.id === active.note.id)
        if (lead && lead.pitch !== active.auditionPitch) {
          active.auditionPitch = lead.pitch
          onAudition?.(lead)
        }
      }
      event.currentTarget.style.cursor = active.mode === 'resize' ? 'ew-resize' : 'grabbing'
    } else {
      const gridWidth = contentWidth
      const note = noteAtPoint(state.notes, x, y, gridWidth, safeRowHeight, totalTicks)
      const right = note ? (note.start + note.duration) / totalTicks * gridWidth : 0
      const handle = note ? Math.min(8, note.duration / totalTicks * gridWidth / 3) : 0
      event.currentTarget.style.cursor = note ? x >= right - handle ? 'ew-resize' : 'grab' : 'crosshair'
    }
  }

  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointerId !== event.pointerId) return
    pointerMove(event)
    finish(true)
  }
  const pointerCancel = () => finish(false)
  const lostPointerCapture = () => { if (gesture.current) finish(false) }

  return {
    host, scrollbar, horizontalScrollbar, width, viewportHeight, contentHeight,
    safeRowHeight, offset, left, contentWidth, marquee,
    pointerDown, pointerMove, pointerUp, pointerCancel, lostPointerCapture,
    keyDown, verticalScroll, horizontalScroll,
  }
}
