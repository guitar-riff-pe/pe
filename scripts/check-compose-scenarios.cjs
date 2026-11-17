// Run against the real Compose stack. Only this run's room deadlines are advanced.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const { pathToFileURL } = require('node:url')

const root = path.resolve(__dirname, '..')
const artifacts = path.join(root, '.artifacts', 'compose')
fs.mkdirSync(artifacts, { recursive: true })
const frontend = process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3000'
const backend = process.env.E2E_BACKEND_URL || 'http://127.0.0.1:8000/api/v1'
const run = Date.now().toString(36)
const checks = []
const errors = []
const sounds = new Set()
const actors = []
const exec = promisify(execFile)
let room

async function check(name, fn) {
  await fn()
  checks.push(name)
  console.log(`PASS ${name}`)
}

async function rpc(actor, method, url, body, expected = 200, csrf = true) {
  const result = await actor.page.evaluate(async ({ backend, method, url, body, csrf }) => {
    const response = await fetch(backend + url, {
      method, credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Protection': '1' } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    return { status: response.status, body: await response.text() }
  }, { backend, method, url, body, csrf })
  assert.equal(result.status, expected, `${method} ${url}: ${result.status} ${result.body}`)
  return result.body ? JSON.parse(result.body) : null
}

async function fill(page, label, value) {
  const handle = await page.evaluateHandle(label => {
    const field = [...document.querySelectorAll('label')].find(el => el.textContent.trim() === label)
    return field && document.getElementById(field.htmlFor)
  }, label)
  assert.ok(handle.asElement(), `field ${label}`)
  await handle.asElement().click({ clickCount: 3 })
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control')
  await page.keyboard.sendCharacter(value)
  await handle.dispose()
}

async function click(page, label, selector = 'button') {
  const handle = await page.evaluateHandle((label, selector) => [...document.querySelectorAll(selector)].find(el =>
    el.getClientRects().length > 0 && (el.getAttribute('aria-label') === label || el.textContent.trim().startsWith(label))), label, selector)
  assert.ok(handle.asElement(), `button/link ${label}`)
  await handle.asElement().click()
  await handle.dispose()
}

const text = (page, value) => page.waitForFunction(value => document.body.textContent.includes(value), {}, value)
const route = (page, value) => page.waitForFunction(value => location.pathname === value, {}, value)
const open = (actor, url) => actor.page.goto(frontend + url, { waitUntil: 'networkidle2' })

async function advance(roundId, stage) {
  assert.match(roundId, /^[0-9a-f-]{36}$/)
  assert.ok(room.name.startsWith('E2E ' + run))
  const code = `import sys\nfrom uuid import UUID\nfrom datetime import datetime, timezone, timedelta\nfrom sqlalchemy import create_engine, select, update\nfrom app.core.config import Settings\nfrom app.infrastructure.repositories.sql import normalize_database_url\nfrom app.infrastructure.orm import RoundRow, RoomRow\nengine=create_engine(normalize_database_url(Settings().database_url))\nwith engine.begin() as tx:\n row=tx.execute(select(RoomRow.name).where(RoomRow.id==UUID(sys.argv[2]))).scalar_one()\n assert row==sys.argv[3]\n now=datetime.now(timezone.utc)\n values=dict(composing_ends_at=now-timedelta(seconds=2),voting_ends_at=now+timedelta(seconds=180) if sys.argv[4]=='voting' else now-timedelta(seconds=1))\n result=tx.execute(update(RoundRow).where(RoundRow.id==UUID(sys.argv[1]),RoundRow.room_id==UUID(sys.argv[2])).values(**values))\n assert result.rowcount==1\nprint('Advanced only the E2E round deadline')`
  await exec('docker', ['compose', 'exec', '-T', 'backend', 'python', '-c', code + '\nengine.dispose()', roundId, room.id, room.name, stage], {
    cwd: root, windowsHide: true, timeout: 90_000,
  })
}

async function main() {
  const packages = path.join(root, 'node_modules/.pnpm')
  const installed = fs.readdirSync(packages).find(name => name.startsWith('puppeteer-core@'))
  const { default: puppeteer } = await import(pathToFileURL(path.join(packages, installed, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, pipe: true })
  const report = { run, frontend, backend, checks, browserErrors: errors }
  try {
    async function actor(name) {
      const context = await browser.createBrowserContext()
      const page = await context.newPage()
      page.setDefaultTimeout(30_000)
      await page.setViewport({ width: 1440, height: 1000 })
      page.on('pageerror', error => errors.push({ actor: name, message: error.message }))
      page.on('response', response => {
        if (response.status() >= 500) errors.push({ actor: name, status: response.status(), url: response.url() })
        if (response.ok() && /\/sounds\/.*\.(wav|mp3)/.test(response.url())) sounds.add(response.url())
      })
      const result = { name, context, page }
      actors.push(result)
      await open(result, '/')
      return result
    }
    const host = await actor('host')
    const second = await actor('second')
    const third = await actor('third')
    const outsider = await actor('outsider')
    const email = `e2e-${run}@example.test`
    const password = `E2E-${run}-password`

    await check('real registration, HttpOnly cookie, reload and profile', async () => {
      await open(host, '/register')
      await fill(host.page, 'Никнейм', `E2EHost${run}`)
      await fill(host.page, 'Электронная почта', email)
      await fill(host.page, 'Пароль', password)
      await click(host.page, 'Создать аккаунт')
      await route(host.page, '/rooms')
      const cookie = (await host.context.cookies()).find(item => item.name === 'riff_session')
      assert.ok(cookie?.httpOnly)
      assert.equal(await host.page.evaluate(() => document.cookie.includes('riff_session')), false)
      await host.page.reload({ waitUntil: 'networkidle2' })
      host.player = await rpc(host, 'GET', '/session/me')
      assert.equal(host.player.kind, 'account')
      await open(host, '/profile')
      await text(host.page, `E2EHost${run}`)
      assert.equal((await rpc(host, 'GET', '/profile/me')).battles, 0)
    })

    await check('Unicode profile is saved and survives reload', async () => {
      await click(host.page, 'Редактировать профиль')
      await host.page.waitForSelector('[role="dialog"]')
      await fill(host.page, 'Имя игрока', '🎸'.repeat(24))
      await fill(host.page, 'Имя пользователя', `e2e_${run}`)
      await click(host.page, 'Сохранить')
      await host.page.waitForSelector('[role="dialog"]', { hidden: true })
      assert.equal((await rpc(host, 'GET', '/profile/me')).name, '🎸'.repeat(24))
      await host.page.reload({ waitUntil: 'networkidle2' })
      await text(host.page, '🎸'.repeat(24))
    })

    await check('independent guest sessions and forbidden guest profile', async () => {
      for (const actor of [second, third, outsider]) {
        await open(actor, '/login')
        await fill(actor.page, 'Ник для гостевой игры', `E2E${actor.name}${run}`)
        await click(actor.page, 'Продолжить гостем')
        await route(actor.page, '/rooms')
        actor.player = await rpc(actor, 'GET', '/session/me')
        assert.equal(actor.player.kind, 'guest')
      }
      assert.equal(new Set([host, second, third, outsider].map(a => a.player.id)).size, 4)
      await rpc(second, 'GET', '/profile/me', undefined, 403)
      await rpc(host, 'POST', '/rooms', {}, 403, false)
    })

    await check('private 8-bar room through UI and minimum player limit', async () => {
      await open(host, '/rooms/create')
      await fill(host.page, 'Название комнаты', `E2E ${run} private`)
      await host.page.click('input[name="visibility"][value="private"] + span')
      await host.page.click('input[name="riffLength"][value="8"] + span')
      await host.page.click('[role="combobox"]')
      await click(host.page, '3 игрока', '[role="option"]')
      await click(host.page, 'Создать и перейти в лобби')
      await route(host.page, '/rooms/lobby')
      room = await rpc(host, 'GET', '/rooms/current')
      report.roomId = room.id
      assert.equal(room.bars, 8)
      assert.equal(room.visibility, 'private')
      assert.equal(room.capacity, 3)
      assert.ok(!(await rpc(outsider, 'GET', '/rooms')).some(item => item.id === room.id))
      await rpc(host, 'POST', `/rooms/${room.id}/rounds`, {}, 409)
      await rpc(outsider, 'GET', `/rooms/${room.id}`, undefined, 404)
    })

    await check('join by code and invitation, capacity and host restrictions', async () => {
      await open(second, '/rooms')
      await second.page.click('details summary')
      await fill(second.page, 'Код комнаты', room.code.toLowerCase())
      await click(second.page, 'Войти по коду')
      await route(second.page, '/rooms/lobby')
      await open(third, `/rooms?code=${room.code}`)
      await click(third.page, 'Войти по коду')
      await route(third.page, '/rooms/lobby')
      await host.page.waitForFunction(() => document.querySelectorAll('[data-role="guest"], [data-role="host"]').length === 3)
      assert.equal((await rpc(host, 'GET', `/rooms/${room.id}`)).members.length, 3)
      await rpc(outsider, 'POST', '/rooms/join', { code: room.code }, 409)
      await rpc(second, 'POST', `/rooms/${room.id}/rounds`, {}, 403)
    })

    let round
    let hostRiff
    let secondRiff
    let thirdRiff
    const payload = { timbre: 'clean', notes: [{ pitch: 'E3', start: 24, duration: 1, velocity: 100 }] }
    await check('start from lobby, three clients follow composing, editor save/reload', async () => {
      await click(host.page, 'Начать баттл')
      await Promise.all([host, second, third].map(a => route(a.page, '/rooms/compose')))
      round = await rpc(host, 'GET', `/rounds/${new URL(host.page.url()).searchParams.get('roundId')}`)
      assert.equal(round.stage, 'composing')
      assert.equal(round.riffs, null)
      await rpc(host, 'POST', `/rooms/${room.id}/rounds`, {}, 409)
      await host.page.waitForSelector('[aria-label="Редактор нот E2–E6"] canvas')
      const bounds = await host.page.$eval('[aria-label="Редактор нот E2–E6"]', el => {
        const rect = el.getBoundingClientRect()
        return { x: rect.x + 72 + (rect.width - 72) * 0.8, y: rect.y + 42 }
      })
      await host.page.mouse.click(bounds.x, bounds.y)
      // Reload before submission: the live draft must survive without becoming a server save.
      await host.page.waitForFunction(roundId => Object.keys(localStorage).some(key => {
        if (!key.endsWith('.' + roundId)) return false
        return JSON.parse(localStorage.getItem(key)).draft.notes.length === 1
      }), {}, round.id)
      assert.equal((await rpc(host, 'GET', `/rounds/${round.id}`)).own_riff, null)
      host.page.once('dialog', dialog => dialog.accept())
      await host.page.reload({ waitUntil: 'networkidle2' })
      await host.page.waitForSelector('[aria-label="Редактор нот E2–E6"] canvas')
      await click(host.page, 'Отправить рифф')
      await text(host.page, 'Рифф отправлен')
      hostRiff = (await rpc(host, 'GET', `/rounds/${round.id}`)).own_riff
      assert.equal(hostRiff.notes.length, 1)
      assert.ok(hostRiff.notes[0].start > 16, 'note in the second half of an eight-bar round')
      secondRiff = await rpc(second, 'PUT', `/rounds/${round.id}/riff`, payload)
      thirdRiff = await rpc(third, 'PUT', `/rounds/${round.id}/riff`, { ...payload, timbre: 'distortion' })
      await host.page.reload({ waitUntil: 'networkidle2' })
      await text(host.page, 'Рифф отправлен')
      assert.deepEqual((await rpc(host, 'GET', `/rounds/${round.id}`)).own_riff.notes, hostRiff.notes)
    })

    await check('real guitar samples and backing loop play in the browser', async () => {
      await click(host.page, 'Воспроизвести рифф')
      await text(host.page, 'Такт 1 из 8')
      assert.ok([...sounds].some(url => url.includes('wavebase-guitar')))
      assert.ok([...sounds].some(url => url.includes('/drums/')))
      await click(host.page, 'Остановить рифф')
    })

    await check('server-driven voting, anonymous riffs, immutable votes and late save rejection', async () => {
      await advance(round.id, 'voting')
      await Promise.all([host, second, third].map(a => route(a.page, '/rooms/vote')))
      const ballot = await rpc(host, 'GET', `/rounds/${round.id}`)
      assert.equal(ballot.riffs.length, 3)
      assert.ok(ballot.riffs.every(riff => riff.author_id === null && riff.author_nickname === null))
      await rpc(host, 'PUT', `/rounds/${round.id}/riff`, payload, 409)
      await rpc(host, 'POST', `/rounds/${round.id}/votes`, { riff_id: hostRiff.id }, 403)
      const index = ballot.riffs.findIndex(riff => riff.id === secondRiff.id)
      const cards = await host.page.$$('[role="article"]')
      await (await cards[index].$('button:not([aria-label])')).click()
      await text(host.page, 'Голос подтверждён')
      await rpc(host, 'POST', `/rounds/${round.id}/votes`, { riff_id: thirdRiff.id }, 409)
      await rpc(second, 'POST', `/rounds/${round.id}/votes`, { riff_id: hostRiff.id }, 201)
      await rpc(third, 'POST', `/rounds/${round.id}/votes`, { riff_id: hostRiff.id }, 201)
      await host.page.reload({ waitUntil: 'networkidle2' })
      await text(host.page, 'Голос подтверждён')
    })

    await check('results reveal authors and winner, profile history and votes persist', async () => {
      await advance(round.id, 'results')
      await Promise.all([host, second, third].map(a => route(a.page, '/rooms/results')))
      const result = await rpc(host, 'GET', `/rounds/${round.id}`)
      assert.deepEqual(result.winner_ids, [hostRiff.id])
      assert.equal(result.votes_count, 3)
      assert.equal(result.riffs.find(r => r.id === hostRiff.id).votes, 2)
      assert.ok(result.riffs.every(riff => riff.author_id && riff.author_nickname))
      await rpc(second, 'POST', `/rounds/${round.id}/votes`, { riff_id: hostRiff.id }, 409)
      const profile = await rpc(host, 'GET', '/profile/me')
      assert.equal(profile.battles, 1)
      assert.equal(profile.wins, 1)
      assert.equal(profile.votes, 2)
      assert.equal(profile.history.length, 1)
      await open(host, '/profile')
      await text(host.page, 'E2E ' + run)
      await open(host, `/rooms/results?roundId=${round.id}`)
    })

    await check('restart from results and empty-round results', async () => {
      await click(host.page, 'Сыграть ещё раз')
      await route(host.page, '/rooms/compose')
      const nextId = new URL(host.page.url()).searchParams.get('roundId')
      assert.notEqual(nextId, round.id)
      const next = await rpc(host, 'GET', `/rounds/${nextId}`)
      assert.equal(next.number, 2)
      await advance(nextId, 'results')
      await route(host.page, '/rooms/results')
      await text(host.page, 'Никто не отправил рифф')
      const result = await rpc(host, 'GET', `/rounds/${nextId}`)
      assert.deepEqual(result.winner_ids, [])
      assert.deepEqual(result.riffs, [])
    })

    await check('host leaves through UI, ownership transfers, old results remain accessible', async () => {
      await open(host, `/rooms/lobby?roomId=${room.id}&stay=true`)
      await click(host.page, 'Выйти из комнаты')
      await route(host.page, '/rooms')
      assert.equal(await rpc(host, 'GET', '/rooms/current'), null)
      assert.equal((await rpc(second, 'GET', `/rooms/${room.id}`)).host_id, second.player.id)
      assert.equal((await rpc(host, 'GET', `/rounds/${round.id}`)).stage, 'results')
      await rpc(second, 'DELETE', `/rooms/${room.id}/membership`, undefined, 204)
      await rpc(third, 'DELETE', `/rooms/${room.id}/membership`, undefined, 204)
      await rpc(outsider, 'POST', '/rooms/join', { code: room.code }, 404)
    })

    await check('public rooms and mobile layout', async () => {
      const publicRoom = await rpc(second, 'POST', '/rooms', { name: `E2E ${run} public`, visibility: 'public', capacity: 3, bars: 4 }, 201)
      try {
        assert.ok((await rpc(outsider, 'GET', '/rooms')).some(item => item.id === publicRoom.id))
        await outsider.page.setViewport({ width: 390, height: 844 })
        await open(outsider, '/rooms')
        await text(outsider.page, publicRoom.name)
        assert.equal(await outsider.page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
      } finally { await rpc(second, 'DELETE', `/rooms/${publicRoom.id}/membership`, undefined, 204) }
    })

    await check('logout revokes the JWT, invalid login rejected, real login restores account', async () => {
      const oldCookie = (await host.context.cookies()).find(item => item.name === 'riff_session')
      await open(host, '/profile')
      await click(host.page, 'Выйти')
      await route(host.page, '/login')
      await rpc(host, 'GET', '/session/me', undefined, 401)
      const revoked = await fetch(backend + '/session/me', { headers: { Cookie: `riff_session=${oldCookie.value}` } })
      assert.equal(revoked.status, 401)
      await rpc(host, 'POST', '/auth/login', { email, password: 'wrong-password' }, 401)
      await fill(host.page, 'Электронная почта', email)
      await fill(host.page, 'Пароль', password)
      await click(host.page, 'Войти')
      await route(host.page, '/rooms')
      assert.equal((await rpc(host, 'GET', '/session/me')).id, host.player.id)
      await rpc(host, 'POST', '/auth/password-reset/confirm', { token: 'invalid-token', password }, 422)
    })

    assert.deepEqual(errors, [], 'no browser exceptions or HTTP 5xx')
    report.success = true
    report.audioAssets = sounds.size
  } catch (error) {
    report.success = false
    report.failure = error.stack
    for (const actor of actors) {
      console.error(actor.name, actor.page.url())
      await actor.page.screenshot({ path: path.join(artifacts, `compose-failure-${run}-${actor.name}.png`), fullPage: true }).catch(() => {})
    }
    throw error
  } finally {
    // Close only memberships created by this run; preserve results as evidence.
    for (const actor of actors) {
      try {
        const current = await rpc(actor, 'GET', '/rooms/current')
        if (current?.name.startsWith(`E2E ${run}`)) await rpc(actor, 'DELETE', `/rooms/${current.id}/membership`, undefined, 204)
      } catch { /* The actor may already be logged out. */ }
    }
    fs.writeFileSync(path.join(artifacts, 'compose-scenarios-report.json'), JSON.stringify(report, null, 2) + '\n')
    await browser.close()
  }
  console.log(`All ${checks.length} Compose scenarios passed; ${sounds.size} audio assets loaded`)
}

main().catch(error => { console.error(error); process.exitCode = 1 })
