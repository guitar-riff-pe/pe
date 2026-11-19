import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { after, before, test } from 'node:test'
import ts from 'typescript'
import axios from 'axios'

// Supply the request context normally provided by the TanStack server runtime.
const runtime = `data:text/javascript,${encodeURIComponent(`
  import { AsyncLocalStorage } from 'node:async_hooks'
  export const context = new AsyncLocalStorage()
  export const getRequestHeader = () => context.getStore()
  export const createIsomorphicFn = () => ({ server: fn => ({ client: () => fn }) })
`)}`
const clientUrl = new URL('../src/shared/api/client.ts', import.meta.url).href
const errorsUrl = new URL('../src/shared/lib/errors/index.ts', import.meta.url).href
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '../lib/errors' && context.parentURL === clientUrl) return { url: errorsUrl, shortCircuit: true }
    if (['@tanstack/react-start', '@tanstack/react-start/server'].includes(specifier)) {
      return { url: runtime, shortCircuit: true }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url !== clientUrl && url !== errorsUrl) return next(url, context)
    const source = readFileSync(new URL(url), 'utf8').replace('import.meta.env', '({})')
    return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText }
  },
})
const { context } = await import(runtime)
const { apiRequest, apiGet, ApiError } = await import(clientUrl)
const { getErrorDetails } = await import(errorsUrl)
const oldUrl = process.env.API_INTERNAL_URL
const server = createServer(async (req, res) => {
  if (req.url === '/api/v1/slow') return
  if (req.url === '/api/v1/disconnected') { req.socket.destroy(); return }
  if (req.url === '/api/v1/english-error') { res.writeHead(403).end('{"detail":"Forbidden"}'); return }
  if (req.url === '/api/v1/empty') { res.writeHead(204).end(); return }
  if (req.url === '/api/v1/unauthorized') {
    res.writeHead(401, { 'Content-Type': 'application/json' }).end('{"detail":"Войдите"}')
    return
  }
  if (req.url === '/api/v1/broken') { res.writeHead(502).end('<html>Bad gateway</html>'); return }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ url: req.url, method: req.method, headers: req.headers, body: Buffer.concat(chunks).toString() }))
})
before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  process.env.API_INTERNAL_URL = `http://127.0.0.1:${server.address().port}/api/v1/`
})
after(async () => {
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
  if (oldUrl === undefined) delete process.env.API_INTERNAL_URL
  else process.env.API_INTERNAL_URL = oldUrl
  hooks.deregister()
})

test('serializes objects as JSON, preserves the API prefix and adds CSRF protection', async () => {
  const response = await apiRequest('/echo', { method: 'POST', data: { name: 'Комната' }, params: { page: 2 } })
  assert.equal(response.url, '/api/v1/echo?page=2')
  assert.equal(response.headers['content-type'], 'application/json')
  assert.equal(response.headers['x-csrf-protection'], '1')
  assert.deepEqual(JSON.parse(response.body), { name: 'Комната' })
})

test('concurrent SSR requests do not share cookies or custom headers', async () => {
  const responses = await Promise.all(['session=one', 'session=two', undefined].map(cookie =>
    context.run(cookie, () => apiGet('/echo'))))
  assert.deepEqual(responses.map(value => value.headers.cookie), ['session=one', 'session=two', undefined])
  for (const response of responses) assert.equal(response.headers['x-csrf-protection'], undefined)
  const custom = await apiRequest('/echo', { headers: { 'X-Example': 'value' } })
  assert.equal(custom.headers['x-example'], 'value')
  assert.equal((await apiGet('/echo')).headers['x-example'], undefined)
})

test('204 returns undefined and HTTP failures preserve the ApiError contract', async () => {
  assert.equal(await apiRequest('/empty', { method: 'DELETE' }), undefined)
  await assert.rejects(apiGet('/unauthorized'), error => error instanceof ApiError && error.status === 401 && error.message === 'Войдите')
  await assert.rejects(apiGet('/broken'), error => error instanceof ApiError && error.status === 502 && error.message === 'На сервере произошла ошибка. Попробуй ещё раз чуть позже.')
})

test('network and English API failures are localized without losing the cause', async () => {
  await assert.rejects(apiGet('/disconnected'), error => error instanceof ApiError && error.status === 0
    && error.message === 'Не удалось связаться с сервером. Проверьте подключение к интернету и попробуйте ещё раз.'
    && axios.isAxiosError(error.cause))
  await assert.rejects(apiGet('/english-error'), error => error instanceof ApiError && error.status === 403 && error.message === 'У тебя нет доступа к этому действию.')
})

test('classifies fetch, timeout, chunk and HTTP failures without exposing technical details', () => {
  assert.equal(getErrorDetails(new TypeError('Failed to fetch')).kind, 'network')
  assert.equal(getErrorDetails(new Error('Network Error')).kind, 'network')
  assert.equal(getErrorDetails(new ApiError(0, 'timeout', { cause: { code: 'ETIMEDOUT' } })).kind, 'timeout')
  assert.equal(getErrorDetails(new TypeError('Failed to fetch dynamically imported module: /assets/page.js')).kind, 'chunk')
  for (const [status, kind] of [[401, 'unauthorized'], [403, 'forbidden'], [404, 'not-found'], [429, 'rate-limit'], [503, 'server']]) {
    assert.equal(getErrorDetails({ status }).kind, kind)
  }
  for (const error of [undefined, null, new Error('database password=secret'), { status: 500, message: 'Ошибка SQL: secret' }]) {
    assert.ok(!getErrorDetails(error).message.includes('secret'))
  }
  assert.equal(getErrorDetails({ status: 422, message: 'Название уже занято' }).message, 'Название уже занято')
})

test('AbortSignal cancels an active request without converting cancellation into ApiError', async () => {
  const controller = new AbortController()
  const request = apiGet('/slow', controller.signal)
  const timer = setTimeout(() => controller.abort(), 30)
  try { await assert.rejects(request, error => axios.isCancel(error) && !(error instanceof ApiError)) }
  finally { clearTimeout(timer) }
})
