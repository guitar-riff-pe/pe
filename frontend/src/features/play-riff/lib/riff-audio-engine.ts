// The classes entry avoids the root entry's legacy global-context getters,
// which would allocate an extra AudioContext unrelated to this editor.
import * as Tone from 'tone/build/esm/classes.js'
import { setContext } from 'tone/build/esm/core/Global.js'
import type { RiffNote } from '@entities/riffs'
import { scheduleRiff, type RiffTiming, type ScheduledNote } from './riff-schedule'
import { GUITAR_ASSET_DIRECTORY, GUITAR_SAMPLES } from './guitar-samples'

/** One owned context/transport per editor; never touches Tone's global transport. */
export class RiffAudioEngine {
  private readonly context: Tone.Context
  private readonly output: Tone.Gain
  private readonly drive: Tone.Distortion
  private backing: Tone.Player | null = null
  private backingBuffer: AudioBuffer | null = null
  private backingUrl = ''
  private backingLoads = new Map<string, Promise<AudioBuffer>>()
  private backingRequest = 0
  private synth: Tone.Sampler | null = null
  private audition: Tone.Sampler | null = null
  private buffers: Record<number, AudioBuffer> = {}
  private sampleLoads = new Map<number, Promise<void>>()
  private activeLoads = 0
  private loadQueue: (() => void)[] = []
  private disposed = false
  private part: Tone.Part<ScheduledNote> | null = null
  private startAt = 0
  private secondsPerTick = 1
  private duration = 0

  constructor(raw: AudioContext) {
    this.context = new Tone.Context({ context: raw, lookAhead: 0.05, updateInterval: 0.02 })
    // Tone's node defaults request a global context even when an explicit one
    // is supplied. Register this context before constructing nodes so Tone
    // does not silently allocate a second native context. Every node below
    // still receives its owner's context, including across multiple editors.
    setContext(this.context)
    this.output = new Tone.Gain({ context: this.context, gain: 0.36 }).toDestination()
    this.drive = new Tone.Distortion({ context: this.context, distortion: 0.65, wet: 0 }).connect(this.output)
  }

  resume() { return this.context.resume() }

  private async loadSample(pitch: number, signal: AbortSignal) {
    await new Promise<void>(resolve => {
      const begin = () => { this.activeLoads++; resolve() }
      if (this.activeLoads < 4) begin()
      else this.loadQueue.push(begin)
    })
    try {
      if (signal.aborted || this.disposed) throw new DOMException('Guitar loading cancelled', 'AbortError')
      const filename = GUITAR_SAMPLES[pitch]
      if (!filename) throw new Error(`No guitar recording for MIDI ${pitch}`)
      const base = `${import.meta.env.BASE_URL}${GUITAR_ASSET_DIRECTORY}`
      const response = await fetch(base + filename, { signal })
      if (!response.ok) throw new Error(`Guitar sample ${filename}: HTTP ${response.status}`)
      const decoded = await this.context.decodeAudioData(await response.arrayBuffer())
      if (signal.aborted || this.disposed) throw new DOMException('Guitar loading cancelled', 'AbortError')
      this.buffers[pitch] = decoded
      this.audition?.add(Tone.Frequency(pitch, 'midi').toNote(), decoded)
    } finally {
      this.activeLoads--
      this.loadQueue.shift()?.()
    }
  }

  async loadSamples(signal: AbortSignal, pitches: readonly number[]) {
    const loads = [...new Set(pitches)].map(pitch => {
      if (this.buffers[pitch]) return Promise.resolve()
      const pending = this.sampleLoads.get(pitch)
      if (pending) return pending
      const load = this.loadSample(pitch, signal).finally(() => this.sampleLoads.delete(pitch))
      this.sampleLoads.set(pitch, load)
      return load
    })
    await Promise.all(loads)
  }

  hasSounds(pitches: readonly number[], backingUrl?: string) {
    return !this.disposed && pitches.every(pitch => !!this.buffers[pitch]) &&
      (!backingUrl || (backingUrl === this.backingUrl && !!this.backingBuffer))
  }

  async loadBacking(url: string, signal: AbortSignal) {
    const request = ++this.backingRequest
    if (signal.aborted || this.disposed) throw new DOMException('Loop loading cancelled', 'AbortError')
    if (!url || (url === this.backingUrl && this.backingBuffer)) return
    let load = this.backingLoads.get(url)
    if (!load) {
      load = (async () => {
        const response = await fetch(url, { signal })
        if (!response.ok) throw new Error(`Drum loop: HTTP ${response.status}`)
        return this.context.decodeAudioData(await response.arrayBuffer())
      })().finally(() => this.backingLoads.delete(url))
      this.backingLoads.set(url, load)
    }
    const buffer = await load
    if (signal.aborted || this.disposed) throw new DOMException('Loop loading cancelled', 'AbortError')
    if (request === this.backingRequest) {
      this.backingBuffer = buffer
      this.backingUrl = url
    }
  }

  setTimbre(timbre: 'clean' | 'distortion') {
    this.drive.wet.value = timbre === 'distortion' ? 0.7 : 0
  }

  private sampler() {
    if (this.disposed || !Object.keys(this.buffers).length) {
      throw new Error('Guitar samples are not ready')
    }
    return new Tone.Sampler({
      context: this.context, urls: this.buffers, attack: 0.003, release: 0.08, volume: -6,
    }).connect(this.drive)
  }

  setVolume(value: number) {
    this.output.gain.rampTo(Math.max(0, Math.min(1, value)) ** 2, 0.02)
  }

  preview(note: RiffNote) {
    this.audition ??= this.sampler()
    this.audition.releaseAll(this.context.now())
    this.audition.triggerAttackRelease(440 * 2 ** ((note.pitch - 69) / 12), 0.18, this.context.now(), note.velocity)
  }

  play(notes: readonly RiffNote[], bpm: number, timing: RiffTiming, backingUrl?: string) {
    this.stop()
    const schedule = scheduleRiff(notes, bpm, timing)
    this.secondsPerTick = schedule.secondsPerTick
    this.duration = schedule.duration
    const transport = this.context.transport
    transport.bpm.value = schedule.tempo
    this.synth = notes.length ? this.sampler() : null
    this.part = new Tone.Part<ScheduledNote>({
      context: this.context,
      events: schedule.events,
      callback: (time, event) => this.synth?.triggerAttackRelease(event.frequency, event.duration, time, event.velocity),
    }).start(0)
    this.startAt = this.context.now() + 0.03
    if (backingUrl && this.backingBuffer && this.backingUrl === backingUrl) {
      this.backing = new Tone.Player({ context: this.context, url: this.backingBuffer, loop: true,
        playbackRate: this.backingBuffer.duration / this.duration, volume: -8 }).connect(this.output)
      this.backing.start(this.startAt)
      this.backing.stop(this.startAt + this.duration)
    }
    transport.start(this.startAt, 0)
    transport.stop(this.startAt + this.duration)
  }

  position() {
    const elapsed = Math.max(0, this.context.immediate() - this.startAt)
    return { ticks: Math.min(elapsed, this.duration) / this.secondsPerTick, ended: elapsed >= this.duration }
  }

  stop() {
    this.context.transport.stop(this.context.immediate())
    this.part?.dispose()
    this.part = null
    this.context.transport.cancel(0)
    this.synth?.dispose()
    this.synth = null
    this.audition?.releaseAll(this.context.immediate())
    this.backing?.dispose()
    this.backing = null
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.stop()
    this.audition?.dispose()
    this.audition = null
    this.buffers = {}
    this.backingBuffer = null
    this.drive.dispose()
    this.output.dispose()
    this.context.dispose()
  }
}
