import type { LobbyRoom } from '@entities/rooms'

export const demoLobby: LobbyRoom = {
  name: 'Midnight Garage',
  code: 'X7K2M9',
  capacity: 4,
  bpm: 120,
  bars: 4,
  roundMinutes: 5,
  participants: [
    { id: 'neon', name: 'NeonRiff', role: 'host', isSelf: true },
    { id: 'guitar', name: 'GuitarHero', role: 'guest' },
    { id: 'cat', name: 'LoudCat', role: 'guest' },
    { id: 'empty', name: 'Свободное место', role: 'empty' },
  ],
}
