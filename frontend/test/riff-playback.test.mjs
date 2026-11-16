import assert from 'node:assert/strict'
import test from 'node:test'
import { scheduleRiff, normaliseTempo } from '../src/features/play-riff/lib/riff-schedule.ts'

const timing = { ticksPerBeat: 480, lengthTicks: 7680 }
const note = { id: 'a', pitch: 69, start: 480, duration: 240, velocity: 0.8 }

test('musical ticks map to exact audio times and MIDI frequency', () => {
  const result = scheduleRiff([note], 120, timing)
  assert.equal(result.duration, 8)
  assert.deepEqual(result.events[0], { time: 0.5, duration: 0.25, frequency: 440, velocity: 0.8 })
  const fast = scheduleRiff([note], 240, timing)
  assert.equal(fast.duration, 4)
  assert.equal(fast.events[0].time, 0.25)
  assert.equal(fast.events[0].duration, 0.125)
  assert.equal(fast.events[0].frequency, 440)
})

test('chords retain simultaneous onsets and octave frequencies', () => {
  const result = scheduleRiff([note, { ...note, id: 'b', pitch: 81 }], 120, timing)
  assert.equal(result.events[0].time, result.events[1].time)
  assert.equal(result.events[1].frequency, 880)
})

test('notes are sorted, clipped to the party end, and invalid/muted notes are excluded', () => {
  const result = scheduleRiff([
    { ...note, start: 7560, duration: 480, velocity: 2 }, note,
    { ...note, start: 7680 }, { ...note, velocity: 0 }, { ...note, duration: -1 },
    { ...note, start: -1 }, { ...note, pitch: NaN },
  ], 120, timing)
  assert.equal(result.events.length, 2)
  assert.equal(result.events[0].time, 0.5)
  assert.equal(result.events[1].time + result.events[1].duration, result.duration)
  assert.equal(result.events[1].velocity, 1)
})

test('empty party keeps its complete duration and timing inputs are validated', () => {
  assert.deepEqual(scheduleRiff([], 120, timing).events, [])
  assert.equal(scheduleRiff([], 120, timing).duration, 8)
  assert.throws(() => scheduleRiff([], 120, { ...timing, ticksPerBeat: 0 }), /timing/)
})

test('tempo is finite, bounded and rounded', () => {
  assert.equal(normaliseTempo(NaN), 120)
  assert.equal(normaliseTempo(0), 120)
  assert.equal(normaliseTempo(10), 40)
  assert.equal(normaliseTempo(300), 300)
  assert.equal(normaliseTempo(500), 400)
  assert.equal(normaliseTempo(119.7), 120)
})
