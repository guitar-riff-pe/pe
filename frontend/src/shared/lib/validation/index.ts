export function normalizeNickname(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function isValidNickname(value: string): boolean {
  const characters = Array.from(normalizeNickname(value))
  return characters.length >= 2 && characters.length <= 24 && characters.every(char => char.codePointAt(0)! >= 32)
}
