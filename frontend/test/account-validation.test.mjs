import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidNickname, isValidPassword } from '../src/features/account-access/model/validation.ts'

test('nickname validation matches the API range and whitespace normalization', () => {
  assert.equal(isValidNickname(' Я '), false)
  assert.equal(isValidNickname('ОК'), true)
  assert.equal(isValidNickname('  Neon   Riff  '), true)
  assert.equal(isValidNickname('a'.repeat(24)), true)
  assert.equal(isValidNickname('a'.repeat(25)), false)
  assert.equal(isValidNickname('bad\u0000name'), false)
  assert.equal(isValidNickname('🎸'), false)
  assert.equal(isValidNickname('🎸'.repeat(13)), true)
  assert.equal(isValidNickname('🎸'.repeat(24)), true)
  assert.equal(isValidNickname('🎸'.repeat(25)), false)
  assert.equal(isValidNickname('  🎸   𝄞  '), true)
})

test('password validation accepts exactly 8–72 Unicode characters', () => {
  assert.equal(isValidPassword('a'.repeat(7)), false)
  assert.equal(isValidPassword('a'.repeat(8)), true)
  assert.equal(isValidPassword('a'.repeat(72)), true)
  assert.equal(isValidPassword('a'.repeat(73)), false)
  assert.equal(isValidPassword('🎸'.repeat(7)), false)
  assert.equal(isValidPassword('🎸'.repeat(8)), true)
})
