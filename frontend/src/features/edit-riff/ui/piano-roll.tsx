import { lazy, memo, Suspense, useId, type ReactNode } from 'react'
import type { SubscribePosition } from '@shared/lib/playback-position'
import type { RiffNote } from '@entities/riffs'
import type { RiffEditorController } from '../model/use-riff-editor'
import { usePianoRollInteraction } from '../model/use-piano-roll-interaction'
import { RULER_HEIGHT } from '../lib/piano-roll-layout'
import styles from './piano-roll.module.scss'

const RiffEditorCanvas = lazy(() => import('./piano-roll-canvas'))

export type PianoRollProps = {
  editor: RiffEditorController
  height?: number
  rowHeight?: number
  initialPitch?: number
  children?: ReactNode
  readOnly?: boolean
  subscribePosition?: SubscribePosition
  onAudition?: (note: RiffNote) => void
}

export const PianoRoll = memo(function PianoRoll({ editor, height, rowHeight, initialPitch, children, readOnly = false, subscribePosition, onAudition }: PianoRollProps) {
  const { state } = editor
  const totalTicks = state.totalTicks
  const viewportId = useId()
  const {
    host, scrollbar, horizontalScrollbar, width, viewportHeight, contentHeight,
    safeRowHeight, offset, left, contentWidth, marquee,
    pointerDown, pointerMove, pointerUp, pointerCancel, lostPointerCapture,
    keyDown, verticalScroll, horizontalScroll,
  } = usePianoRollInteraction({ editor, height, rowHeight, initialPitch, readOnly, onAudition })

  return <div className={styles.canvas} onKeyDown={keyDown}>
      <div
        ref={host} id={viewportId} className={styles.viewport}
        style={{ height: viewportHeight + RULER_HEIGHT }}
        tabIndex={0} role="region" aria-label="Редактор нот E2–E6"
        aria-disabled={readOnly || undefined}
        onPointerDown={pointerDown} onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerCancel} onLostPointerCapture={lostPointerCapture}
      >
        {/* ResizeObserver runs only in the browser, keeping Konva out of SSR. */}
        {width > 0 && <Suspense fallback={<p className={styles.loading}>Загрузка полотна…</p>}>
          <RiffEditorCanvas width={width} viewportHeight={viewportHeight}
            rowHeight={safeRowHeight} scrollTop={offset}
            notes={state.notes} selectedIds={state.selectedIds}
            scrollLeft={left} contentWidth={contentWidth}
            subscribePosition={subscribePosition} onAudition={readOnly ? undefined : onAudition}
            selectionRectangle={marquee} totalTicks={totalTicks}
          >{children}</RiffEditorCanvas>
        </Suspense>}
      </div>
      <div
        ref={scrollbar} className={styles.scrollbar} tabIndex={0}
        role="region" aria-label="Прокрутка нотных дорожек" aria-controls={viewportId}
        style={{ height: viewportHeight, marginTop: RULER_HEIGHT }}
        onScroll={verticalScroll}
      ><div style={{ height: contentHeight }} /></div>
      <div ref={horizontalScrollbar} className={styles.horizontalScrollbar} tabIndex={0}
        role="region" aria-label="Прокрутка по времени" aria-controls={viewportId}
        onScroll={horizontalScroll}
      ><div style={{ width: contentWidth, height: 1 }} /></div>
  </div>
})
