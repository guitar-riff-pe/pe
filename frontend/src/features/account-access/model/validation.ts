export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isValidNickname(value: string): boolean {
  return /^[\p{L}\p{N}_]{3,20}$/u.test(value.trim())
}

export function isValidPassword(value: string): boolean {
  return value.length >= 8
}
