import { useCallback, useEffect, useRef, useState } from 'react'
import type { RiffNote } from '@entities/riffs'
import type { RiffAudioEngine } from '../lib/riff-audio-engine'
import type { RiffTiming } from '../lib/riff-schedule'
import type { PositionListener, SubscribePosition } from '@shared/lib/playback-position'

export function useRiffPlayback(timing: RiffTiming, options?: { backingUrl?: string; timbre?: 'clean' | 'distortion' }) {
  const optionsRef = useRef(options)
  useEffect(() => { optionsRef.current = options }, [options])
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle')
  const positionTicks = useRef<number | null>(null)
  const listeners = useRef(new Set<PositionListener>())
  const subscribePosition: SubscribePosition = useCallback(listener => {
    listeners.current.add(listener)
    listener(positionTicks.current)
    return () => { listeners.current.delete(listener) }
  }, [])
  const [error, setError] = useState('')
  const [soundState, setSoundState] = useState<'unloaded' | 'loading' | 'ready'>('unloaded')
  const [volume, setVolumeState] = useState(0.6)
  const volumeRef = useRef(0.6)
  const engine = useRef<RiffAudioEngine | null>(null)
  const pending = useRef<Promise<RiffAudioEngine> | null>(null)
  const preparing = useRef<RiffAudioEngine | null>(null)
  const loadingAbort = useRef<AbortController | null>(null)
  const soundRequest = useRef(0)
  const raw = useRef<AudioContext | null>(null)
  const mounted = useRef(true)
  const run = useRef(0)
  const audition = useRef(0)
  const busy = useRef(false)
  const frame = useRef(0)

  const getEngine = useCallback(async () => {
    if (engine.current) { const instance = engine.current; await instance.resume(); return instance }
    if (pending.current) return pending.current
    // Create/resume the native context synchronously inside the user gesture,
    // before the lazy Tone import, to satisfy browser audio activation rules.
    const context = new AudioContext({ latencyHint: 'interactive' })
    raw.current = context
    const abort = new AbortController()
    loadingAbort.current = abort
    const resumed = context.resume()
    const promise = Promise.all([import('../lib/riff-audio-engine'), resumed]).then(async ([module]) => {
      if (!mounted.current || abort.signal.aborted) throw new Error('Editor closed')
      const instance = new module.RiffAudioEngine(context)
      preparing.current = instance
      instance.setVolume(volumeRef.current)
      engine.current = instance
      preparing.current = null
      return instance
    }).catch((reason: unknown) => {
      abort.abort()
      preparing.current?.dispose()
      preparing.current = null
      void context.close().catch(() => {})
      if (raw.current === context) raw.current = null
      throw reason
    }).finally(() => {
      if (pending.current === promise) pending.current = null
    })
    pending.current = promise
    return promise
  }, [])

  const ready = useCallback(async (pitches: readonly number[], backingUrl?: string) => {
    const request = ++soundRequest.current
    if (!engine.current?.hasSounds(pitches, backingUrl)) setSoundState('loading')
    let audio: RiffAudioEngine | null = null
    let abort: AbortController | null = null
    try {
      audio = await getEngine()
      abort = loadingAbort.current
      if (!abort || !mounted.current || abort.signal.aborted) throw new Error('Editor closed')
      await Promise.all([audio.loadSamples(abort.signal, pitches), backingUrl ? audio.loadBacking(backingUrl, abort.signal) : undefined])
      if (!mounted.current || abort.signal.aborted) throw new Error('Editor closed')
      if (request === soundRequest.current) setSoundState('ready')
      return audio
    } catch (reason) {
      abort?.abort()
      audio?.dispose()
      if (audio && engine.current === audio) engine.current = null
      if (mounted.current && request === soundRequest.current) setSoundState('unloaded')
      throw reason
    }
  }, [getEngine])

  const stop = useCallback(() => {
    run.current++
    audition.current++
    busy.current = false
    cancelAnimationFrame(frame.current)
    engine.current?.stop()
    positionTicks.current = null
    for (const listener of listeners.current) listener(null)
    if (mounted.current) setStatus('idle')
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      cancelAnimationFrame(frame.current)
      loadingAbort.current?.abort()
      preparing.current?.dispose()
      preparing.current = null
      engine.current?.dispose()
      engine.current = null
      if (!pending.current) void raw.current?.close().catch(() => {})
    }
  }, [])

  const play = useCallback(async (notes: readonly RiffNote[], bpm: number, sound?: { backingUrl?: string; timbre?: 'clean' | 'distortion' }) => {
    const selected = sound ?? optionsRef.current
    const backingUrl = selected?.backingUrl
    if (!notes.length && !backingUrl) return
    const token = ++run.current
    audition.current++
    busy.current = true
    setError('')
    setStatus('loading')
    try {
      const audio = await ready(notes.map(note => note.pitch), backingUrl)
      if (!mounted.current || run.current !== token) return
      audio.setTimbre(selected?.timbre ?? 'clean')
      audio.play(notes, bpm, timing, backingUrl)
      setStatus('playing')
      const update = () => {
        if (!mounted.current || run.current !== token) return
        const position = audio.position()
        if (position.ended) { stop(); return }
        positionTicks.current = position.ticks
        for (const listener of listeners.current) listener(position.ticks)
        frame.current = requestAnimationFrame(update)
      }
      update()
    } catch {
      if (!mounted.current || run.current !== token) return
      stop()
      setError('Не удалось загрузить звук гитары. Проверь подключение и разрешения браузера, затем попробуй снова.')
    }
  }, [ready, stop, timing])

  const preview = useCallback(async (note: RiffNote) => {
    if (busy.current) return
    const token = ++audition.current
    try {
      const audio = await ready([note.pitch])
      if (!mounted.current || audition.current !== token || busy.current) return
      audio.setTimbre(optionsRef.current?.timbre ?? 'clean')
      audio.preview(note)
      setError('')
    } catch {
      if (mounted.current && audition.current === token) setError('Не удалось загрузить звук гитары. Нажми «Воспроизвести», чтобы попробовать снова.')
    }
  }, [ready])

  const setVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value))
    volumeRef.current = next
    setVolumeState(next)
    engine.current?.setVolume(next)
  }, [])

  return { status, soundState, subscribePosition, error, volume, setVolume, play, stop, preview }
}
