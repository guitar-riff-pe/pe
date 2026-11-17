/** One unmodified wavebase / Parker Fly recording for every E2–E6 pitch. */
export const GUITAR_SAMPLES: Record<number, string> = Object.fromEntries(
  Array.from({ length: 49 }, (_, index) => [40 + index, `${40 + index}.wav`]),
)

export const GUITAR_ASSET_DIRECTORY = 'sounds/wavebase-guitar/'
