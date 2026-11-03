export type Room = {
  id: string
  name: string
  style: 'Rock' | 'Metal' | 'Indie' | 'Любой стиль'
  bpm: number
  players: number
  capacity: number
  status: 'waiting' | 'playing'
}
