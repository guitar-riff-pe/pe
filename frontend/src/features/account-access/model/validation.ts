export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export { isValidNickname } from '../../../shared/lib/validation/index.ts'

export function isValidPassword(value: string): boolean {
  const length = Array.from(value).length
  return length >= 8 && length <= 72
}
