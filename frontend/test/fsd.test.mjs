import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import test from 'node:test'

const exec = promisify(execFile)
const frontend = fileURLToPath(new URL('../', import.meta.url))
const cli = path.join(frontend, 'node_modules/steiger/dist/cli.mjs')

test('FSD configuration enforces boundaries and public APIs', async (t) => {
  // Steiger ignores node_modules, so fixtures must live outside that tree.
  const cache = path.join(tmpdir(), 'pe-fsd-tests')
  await mkdir(cache, { recursive: true })
  const fixture = await mkdtemp(path.join(cache, 'fsd-test-'))
  const write = async (name, content) => {
    const target = path.join(fixture, name)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, content)
  }
  const store = 'src/features/counter/model/store.ts'
  const page = 'src/pages/home/ui/page.ts'
  const baselineStore = 'export const state = 0\nexport type State = number\n'
  const baselinePage = "import { state } from '@features/counter'\nexport const Home = state\n"

  try {
    const configUrl = new URL('../steiger.config.js', import.meta.url).href
    await write('steiger.config.js', `export { default } from ${JSON.stringify(configUrl)}\n`)
    await copyFile(path.join(frontend, 'tsconfig.json'), path.join(fixture, 'tsconfig.json'))
    await write('package.json', '{"type":"module"}')
    await write('src/app/routes/index.ts', "export { Home } from '@pages/home'\n")
    await write('src/pages/home/index.ts', "export { Home } from './ui/page'\n")
    await write('src/features/counter/index.ts', "export { state, type State } from './model/store'\n")
    await write('src/features/reset/index.ts', "export { reset } from './model/reset'\n")
    await write('src/features/reset/model/reset.ts', 'export const reset = 0\n')
    await write(store, baselineStore)
    await write(page, baselinePage)

    const lint = () => exec(process.execPath, [cli, './src', '--fail-on-warnings'], {
      cwd: fixture,
      env: { ...process.env, NO_COLOR: '1' },
      timeout: 60_000,
    })
    await t.test('allows lower-layer public APIs and local relative imports', lint)

    const violations = [
      ['upper layer via alias', store, "import { Home } from '@pages/home'\n", 'fsd/forbidden-imports'],
      ['upper layer via relative path', store, "import { Home } from '../../../pages/home'\n", 'fsd/forbidden-imports'],
      ['sibling slice via alias', store, "import { reset } from '@features/reset'\n", 'fsd/forbidden-imports'],
      ['sibling slice via relative path', store, "import { reset } from '../../reset'\n", 'fsd/forbidden-imports'],
      ['deep alias import', page, "import { state } from '@features/counter/model/store'\n", 'fsd/no-public-api-sidestep'],
      ['deep relative import', page, "import { state } from '../../../features/counter/model/store'\n", 'fsd/no-public-api-sidestep'],
      ['deep type import', page, "import type { State } from '@features/counter/model/store'\n", 'fsd/no-public-api-sidestep'],
    ]
    for (const [name, file, content, rule] of violations) {
      await t.test(`rejects ${name}`, async () => {
        await write(file, content)
        try {
          await assert.rejects(lint(), (error) => {
            assert.equal(error.code, 1)
            assert.ok(`${error.stdout}${error.stderr}`.includes(rule), error.stdout)
            return true
          })
        } finally {
          await write(store, baselineStore)
          await write(page, baselinePage)
        }
      })
    }

    await t.test('requires slice public APIs', async () => {
      await unlink(path.join(fixture, 'src/features/reset/index.ts'))
      try {
        await assert.rejects(lint(), (error) => {
          assert.equal(error.code, 1)
          assert.ok(`${error.stdout}${error.stderr}`.includes('fsd/public-api'), error.stdout)
          return true
        })
      } finally {
        await write('src/features/reset/index.ts', "export { reset } from './model/reset'\n")
      }
    })

    await t.test('rejects layer-wide barrel exports', async () => {
      await write('src/features/index.ts', "export { state } from './counter'\n")
      await assert.rejects(lint(), (error) => {
        assert.equal(error.code, 1)
        assert.ok(`${error.stdout}${error.stderr}`.includes('fsd/no-layer-public-api'), error.stdout)
        return true
      })
    })
  } finally {
    // Only remove the directory created by mkdtemp for this test.
    assert.ok(fixture.startsWith(`${cache}${path.sep}fsd-test-`))
    await rm(fixture, { recursive: true, force: true })
  }
})
