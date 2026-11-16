import type { Room } from './room'
import type { LobbyRoom } from './lobby'

export type RoomRecord = Omit<Room, 'code' | 'members'> & {
  code: string
  host_id: string
  stage: 'lobby' | 'composing' | 'voting' | 'results'
  current_round_id: string | null
  visibility: 'public' | 'private'
  bars: number | null
  members: { id: string; nickname: string; is_host: boolean }[]
}

export type CreateRoomPayload = {
  name: string
  visibility: 'public' | 'private'
  capacity: number
  bars: 4 | 8
}

export function toLobbyRoom(room: RoomRecord, playerId: string): LobbyRoom {
  return {
    name: room.name, code: room.code, capacity: room.capacity, bars: room.bars,
    bpm: room.bpm, roundMinutes: 5,
    participants: [
      ...room.members.map(member => ({ id: member.id, name: member.nickname,
        role: member.is_host ? 'host' as const : 'guest' as const, isSelf: member.id === playerId })),
      ...Array.from({ length: Math.max(0, room.capacity - room.members.length) }, (_, index) => ({
        id: `empty-${index}`, name: 'Ожидаем игрока', role: 'empty' as const,
      })),
    ],
  }
}

export function normalizeRoomCode(value: string) {
  return value.trim().toUpperCase()
}

export function validRoomCode(value: string) {
  return /^[A-Z0-9]{4,8}$/.test(normalizeRoomCode(value))
}
