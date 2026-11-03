import type { Room } from '@entities/rooms'

export const demoRooms: Room[] = [
  { id: 'midnight-garage', name: 'Midnight Garage', style: 'Metal', bpm: 120, players: 3, capacity: 6, status: 'waiting' },
  { id: 'clean-and-simple', name: 'Clean & Simple', style: 'Indie', bpm: 96, players: 2, capacity: 4, status: 'waiting' },
  { id: 'heavy-friday', name: 'Heavy Friday', style: 'Rock', bpm: 140, players: 4, capacity: 6, status: 'playing' },
  { id: 'new-sound', name: 'Новый звук', style: 'Любой стиль', bpm: 110, players: 1, capacity: 4, status: 'waiting' },
]
