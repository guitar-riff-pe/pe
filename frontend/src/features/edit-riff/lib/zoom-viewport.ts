import { clamp } from './editor-geometry.ts'

type ZoomViewport = {
  scale: number
  left: number
  top: number
  width: number
  contentHeight: number
  heightLimit: number
  x: number
  y: number
  delta: number
}

export function zoomViewport(view: ZoomViewport) {
  const scale = clamp(view.scale * Math.exp(-view.delta * 0.002), 0.5, 4)
  const ratio = scale / view.scale
  const nextHeight = view.contentHeight * ratio
  return {
    scale,
    left: clamp((view.left + view.x) * ratio - view.x, 0, Math.max(0, view.width * scale - view.width)),
    top: clamp((view.top + view.y) * ratio - view.y, 0, Math.max(0, nextHeight - view.heightLimit)),
  }
}
