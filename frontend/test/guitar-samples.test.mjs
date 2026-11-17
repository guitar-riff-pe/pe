import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { GUITAR_SAMPLES } from '../src/features/play-riff/lib/guitar-samples.ts'

const root = new URL('../public/sounds/wavebase-guitar/', import.meta.url)

test('every E2–E6 key has an intact original WAV verified against its Git LFS object', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'))
  assert.match(manifest.commit, /^[a-f0-9]{40}$/)
  assert.equal(manifest.license, 'Public Domain')
  assert.equal(manifest.repository, 'https://github.com/cluesurf/wavebase')
  assert.deepEqual(Object.keys(GUITAR_SAMPLES).map(Number), Array.from({ length: 49 }, (_, index) => index + 40))
  assert.deepEqual(Object.values(manifest.samples).map(sample => sample.midi).sort((a, b) => a - b), Object.keys(GUITAR_SAMPLES).map(Number))
  assert.deepEqual(Object.values(GUITAR_SAMPLES).sort(), Object.values(manifest.samples).map(sample => sample.file).sort())
  for (const sample of Object.values(manifest.samples)) {
    const data = await readFile(new URL(sample.file, root))
    assert.equal(data.length, sample.bytes, sample.file)
    assert.equal(createHash('sha256').update(data).digest('hex'), sample.sha256, sample.file)
    assert.equal(sample.sha256, sample.lfsOid, sample.file)
    assert.equal(data.subarray(0, 4).toString(), 'RIFF', sample.file)
    assert.equal(data.subarray(8, 12).toString(), 'WAVE', sample.file)
    assert.ok(sample.duration > 0 && sample.sampleRate > 0, sample.file)
  }
})

test('distribution preserves wavebase provenance and its public-domain declaration', async () => {
  const attribution = await readFile(new URL('ATTRIBUTION.txt', root), 'utf8')
  assert.match(attribution, /ClueSurf \/ wavebase/)
  assert.match(attribution, /Parker Fly/)
  assert.match(attribution, /Public Domain/)
  assert.match(await readFile(new URL('UPSTREAM-README.md', root), 'utf8'), /Files: Public Domain/)
})
