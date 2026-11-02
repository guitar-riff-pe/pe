export type RoomVisibility = 'public' | 'private'
export type RiffLength = '4' | '8'

export const visibilityOptions = [
  { value: 'public', label: 'Публичная' },
  { value: 'private', label: 'Приватная' },
] as const

export const riffLengthOptions = [
  { value: '4', label: '4 такта' },
  { value: '8', label: '8 тактов' },
] as const

export const playerOptions = [
  { value: '2', label: '2 игрока' },
  { value: '3', label: '3 игрока' },
  { value: '4', label: '4 игрока' },
  { value: '5', label: '5 игроков' },
  { value: '6', label: '6 игроков' },
] as const

export function validateRoomName(value: string) {
  const name = value.trim()
  if (!name) return 'Введите название комнаты'
  if (name.length < 3) return 'Название должно содержать минимум 3 символа'
  return undefined
}
