import { useEffect, useRef, useState } from 'react'

export function useDemoRiffPlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const audioRef = useRef<AudioContext | null>(null)
  const timeoutRef = useRef<number | null>(null)

  function stop() {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    if (audioRef.current) void audioRef.current.close()
    audioRef.current = null
    setPlayingId(null)
  }

  async function play(id: string) {
    if (playingId === id) {
      stop()
      return
    }
    stop()
    try {
      const audio = new AudioContext()
      audioRef.current = audio
      await audio.resume()
      const pattern = [0, 3, 5, 7, 5, 3, 2, 0]
      const variation = Math.max(0, id.charCodeAt(0) - 97)
      const startAt = audio.currentTime + .06
      for (let index = 0; index < 16; index += 1) {
        const at = startAt + index * .5
        const oscillator = audio.createOscillator()
        const gain = audio.createGain()
        oscillator.type = id === 'b' ? 'sawtooth' : 'triangle'
        oscillator.frequency.value = 220 * 2 ** ((pattern[index % pattern.length] + variation) / 12)
        gain.gain.setValueAtTime(0, at)
        gain.gain.linearRampToValueAtTime(.045, at + .01)
        gain.gain.linearRampToValueAtTime(0, at + .38)
        oscillator.connect(gain).connect(audio.destination)
        oscillator.start(at)
        oscillator.stop(at + .4)
      }
      setPlayingId(id)
      setError('')
      timeoutRef.current = window.setTimeout(stop, 8100)
    } catch {
      setPlayingId(null)
      setError('Не удалось воспроизвести демо-фрагмент в этом браузере.')
    }
  }

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    if (audioRef.current) void audioRef.current.close()
  }, [])

  return { playingId, error, play, stop }
}
