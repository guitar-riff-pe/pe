import { apiRequest } from '@shared/api'
import type { CreateRoomPayload, RoomRecord } from '../model/room-record'

export const listRooms = (signal?: AbortSignal) => apiRequest<RoomRecord[]>('/rooms', { signal })
export const currentRoom = (signal?: AbortSignal) => apiRequest<RoomRecord | null>('/rooms/current', { signal })
export const getRoom = (id: string, signal?: AbortSignal) => apiRequest<RoomRecord>(`/rooms/${encodeURIComponent(id)}`, { signal })
export const createRoom = (payload: CreateRoomPayload) => apiRequest<RoomRecord>('/rooms', { method: 'POST', body: JSON.stringify(payload) })
export const joinRoom = (code: string) => apiRequest<RoomRecord>('/rooms/join', { method: 'POST', body: JSON.stringify({ code }) })
export const leaveRoom = (id: string) => apiRequest<void>(`/rooms/${encodeURIComponent(id)}/membership`, { method: 'DELETE' })
export const startRoomRound = (id: string) => apiRequest<{ id: string }>(`/rooms/${encodeURIComponent(id)}/rounds`, { method: 'POST', body: '{}' })
