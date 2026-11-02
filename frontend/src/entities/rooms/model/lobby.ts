export type RoomParticipant = {
  id: string
  name: string
  role: 'host' | 'guest' | 'empty'
  isSelf?: boolean
}

export type LobbyRoom = {
  name: string
  code: string
  capacity: number
  bpm: number
  bars: number
  roundMinutes: number
  participants: RoomParticipant[]
}
