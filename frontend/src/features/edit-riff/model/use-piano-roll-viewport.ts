import { useEffect, useLayoutEffect, useRef, useState, type RefObject, type UIEvent } from 'react'
import { GRID_X, GUITAR_ROW_COUNT, RULER_HEIGHT } from '../lib/piano-roll-layout'
import { clamp, HIGHEST_PITCH } from '../lib/editor-geometry'
import { zoomViewport } from '../lib/zoom-viewport'
import type { PointerGesture } from './pointer-gesture'

type Options = {
  host: RefObject<HTMLDivElement | null>
  gesture: RefObject<PointerGesture | null>
  finish: (commit: boolean) => void
  height: number
  rowHeight: number
  initialPitch: number
}

export function usePianoRollViewport({ host, gesture, finish, height, rowHeight, initialPitch }: Options) {
  const scrollbar = useRef<HTMLDivElement>(null)
  const horizontalScrollbar = useRef<HTMLDivElement>(null)
  const pendingZoom = useRef<{ left: number; top: number } | null>(null)
  const [width, setWidth] = useState(0)
  const initialTop = Math.max(0, HIGHEST_PITCH - initialPitch) * Math.max(18, rowHeight)
  const [scrollTop, setScrollTop] = useState(initialTop)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [zoom, setZoom] = useState(1)
  const safeRowHeight = Math.max(18, Number.isFinite(rowHeight) ? rowHeight : 20) * zoom
  const contentHeight = GUITAR_ROW_COUNT * safeRowHeight
  const heightLimit = Math.max(100, Number.isFinite(height) ? height : 480)
  const viewportHeight = Math.min(contentHeight, heightLimit)
  const viewportWidth = Math.max(1, width - GRID_X)
  const contentWidth = viewportWidth * zoom
  const maxScrollLeft = Math.max(0, contentWidth - viewportWidth)
  const left = Math.min(scrollLeft, maxScrollLeft)
  const maxScroll = contentHeight - viewportHeight
  const offset = Math.min(scrollTop, maxScroll)

  useLayoutEffect(() => {
    if (scrollbar.current) scrollbar.current.scrollTop = initialTop
  }, [initialTop])

  useLayoutEffect(() => {
    const position = pendingZoom.current
    if (!position) return
    if (scrollbar.current) scrollbar.current.scrollTop = position.top
    if (horizontalScrollbar.current) horizontalScrollbar.current.scrollLeft = position.left
    pendingZoom.current = null
  }, [zoom])

  useEffect(() => {
    const element = host.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (gesture.current) finish(false)
      setWidth(Math.floor(entry.contentRect.width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [finish, gesture, host])

  useEffect(() => {
    const element = host.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      if (!scrollbar.current) return
      if (gesture.current) { event.preventDefault(); return }
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        const bounds = element.getBoundingClientRect()
        const deltaUnit = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? viewportHeight : 1
        const next = zoomViewport({
          scale: zoom, left: horizontalScrollbar.current?.scrollLeft ?? 0, top: scrollbar.current.scrollTop,
          width: viewportWidth, contentHeight, heightLimit,
          x: clamp(event.clientX - bounds.left - GRID_X, 0, viewportWidth),
          y: clamp(event.clientY - bounds.top - RULER_HEIGHT, 0, viewportHeight),
          delta: event.deltaY * deltaUnit,
        })
        pendingZoom.current = next
        setScrollLeft(next.left)
        setScrollTop(next.top)
        setZoom(next.scale)
        return
      }
      if ((event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) && horizontalScrollbar.current) {
        const current = horizontalScrollbar.current.scrollLeft
        const delta = event.shiftKey ? event.deltaY : event.deltaX
        const next = clamp(current + delta, 0, maxScrollLeft)
        if (current !== next) { event.preventDefault(); horizontalScrollbar.current.scrollLeft = next }
        return
      }
      const scale = event.deltaMode === 1 ? safeRowHeight : event.deltaMode === 2 ? viewportHeight : 1
      const current = scrollbar.current.scrollTop
      const next = Math.max(0, Math.min(maxScroll, current + event.deltaY * scale))
      if (next !== current) {
        event.preventDefault()
        scrollbar.current.scrollTop = next
      }
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [maxScroll, safeRowHeight, viewportHeight, zoom, viewportWidth, contentHeight, heightLimit, maxScrollLeft, gesture, host])

  const verticalScroll = (event: UIEvent<HTMLDivElement>) => {
    if (gesture.current) finish(false)
    setScrollTop(clamp(event.currentTarget.scrollTop, 0, maxScroll))
  }
  const horizontalScroll = (event: UIEvent<HTMLDivElement>) => {
    if (gesture.current) finish(false)
    setScrollLeft(clamp(event.currentTarget.scrollLeft, 0, maxScrollLeft))
  }

  return { scrollbar, horizontalScrollbar, width, viewportHeight, contentHeight,
    safeRowHeight, offset, left, contentWidth, viewportWidth, verticalScroll, horizontalScroll }
}
