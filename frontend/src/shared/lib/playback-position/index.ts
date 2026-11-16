export type PositionListener = (ticks: number | null) => void
export type SubscribePosition = (listener: PositionListener) => () => void
