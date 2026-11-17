const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

async function main() {
  const packages = path.resolve(__dirname, '../../../node_modules/.pnpm')
  const installed = fs.readdirSync(packages).find(name => name.startsWith('puppeteer-core@'))
  const { default: puppeteer } = await import(pathToFileURL(path.join(packages, installed, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, pipe: true })
  try {
    const page = await browser.newPage()
    page.setDefaultTimeout(90000)
    await page.evaluateOnNewDocument(() => {
      let renderer = 0
      const renderers = new Map()
      const roots = new Set()
      window.__componentProps = name => {
        const find = fiber => {
          if (!fiber) return null
          if (fiber.type?.name === name) return fiber.memoizedProps
          return find(fiber.child) || find(fiber.sibling)
        }
        for (const root of roots) { const found = find(root.current); if (found) return found }
        return null
      }
      window.__reactCommits = 0
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        supportsFiber: true, renderers, inject: value => { renderers.set(++renderer, value); return renderer }, checkDCE: () => {},
        onCommitFiberRoot: (_, root) => { roots.add(root); window.__reactCommits++ }, onCommitFiberUnmount: () => {},
      }
    })
    const errors = []
    page.on('pageerror', error => { errors.push(error.message); console.error('PAGE', error.message) })
    page.on('dialog', dialog => dialog.accept())
    let failRound = false
    let voting = false
    let votingEnds = ''
    let voteRequests = 0
    let holdRoomReads = false
    const apiCalls = []
    const joinedRoom = { id: '00000000-0000-4000-8000-000000000002', code: 'ABC123', name: 'Immediate lobby',
      style: 'Rock', bpm: 120, players: 1, capacity: 4, status: 'waiting', stage: 'lobby', visibility: 'public',
      bars: 4, host_id: 'test-player', current_round_id: null, members: [{ id: 'test-player', nickname: 'Проверка', is_host: true }] }
    const roundId = '00000000-0000-4000-8000-000000000001'
    const ends = new Date(Date.now() + 600000).toISOString()
    await page.setRequestInterception(true)
    page.on('request', request => {
      const url = new URL(request.url())
      if (!url.pathname.startsWith('/api/v1')) return request.continue()
      apiCalls.push(`${request.method()} ${url.pathname}`)
      let body = null, status = 200
      if (url.pathname.endsWith('/session/me')) body = { id: 'test-player', nickname: 'Проверка', kind: 'guest' }
      if (url.pathname.endsWith('/rooms')) body = []
      if (holdRoomReads && request.method() === 'GET' && url.pathname.includes('/rooms')) return
      if (request.method() === 'POST' && (url.pathname.endsWith('/rooms/join') || url.pathname.endsWith('/rooms'))) body = joinedRoom
      if (url.pathname.includes('/rounds/')) {
        if (request.method() === 'POST') voteRequests++
        if (failRound) { status = 503; body = { detail: 'Temporary outage' } }
        else body = { id: roundId, room_id: 'room', number: 1, stage: voting ? 'voting' : 'composing', bars: 4, bpm: 120,
          loop_title: 'Тест', loop_url: '/sounds/drums/poly-120-4.wav', composing_ends_at: ends,
          server_now: new Date().toISOString(), own_riff: null, voting_ends_at: votingEnds,
          your_vote_riff_id: null, votes_count: 0,
          riffs: voting ? [{ id: 'riff-a', timbre: 'clean', notes: [], is_own: false }] : null }
      }
      return request.respond({ status, contentType: 'application/json', headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:3000', 'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Protection', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      }, body: JSON.stringify(body) })
    })
    const go = async route => { await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: 'networkidle2', timeout: 180000 }) }
    const click = async text => {
      const handle = await page.evaluateHandle(text => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text), text)
      assert.ok(handle.asElement(), text)
      await handle.asElement().click()
      await handle.dispose()
    }
    const panel = 'details[class*="panel"]'
    const openPanel = async () => {
      await page.waitForSelector(`${panel} summary`)
      await page.focus(`${panel} summary`)
      await page.keyboard.press('Enter')
      await page.waitForSelector(`${panel}[open]`)
      await page.waitForSelector(`${panel} form input[type="number"]`)
    }
    const joinWhileBlocked = async () => {
      await page.waitForFunction(() => !!window.__componentProps('JoinRoomForm'))
      holdRoomReads = true
      await click('Войти по коду →')
      try {
        await page.waitForFunction(() => location.pathname === '/rooms/lobby' && document.body.innerText.includes('Immediate lobby'), { timeout: 30000 })
      } catch (error) {
        console.error('JOIN DEBUG', page.url(), await page.$eval('body', element => element.innerText), apiCalls.slice(-15))
        throw error
      } finally { holdRoomReads = false }
      console.log('PASS join navigation succeeds while room GET requests remain blocked')
    }
    if (process.argv.includes('--round-only')) {
      await go('/rooms/compose')
      await page.click('body')
    } else if (process.argv.includes('--rooms-only')) {
      await go('/rooms?code=ABC123')
      await page.waitForSelector('input[name="roomCode"]')
      await joinWhileBlocked()
    } else {
    await go('/rooms/compose')
    await page.waitForSelector(`${panel} summary`)
    assert.equal(await page.$(`${panel} form`), null, 'closed note panel mounts its fields only on first opening')
    await openPanel()
    await page.focus(`${panel} form input[type="number"]`)
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.body.innerText.includes('Нот: 1 / 512'))
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('riff-battle.riff-draft.local'))?.notes.length === 1)
    await page.focus(`${panel} form input[type="number"]`)
    await page.keyboard.press('ArrowUp')
    await page.evaluate(() => { window.__noteField = document.activeElement })
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('riff-battle.riff-draft.local'))?.notes[0].start === 120)
    assert.equal(await page.evaluate(() => document.activeElement === window.__noteField && window.__noteField.isConnected), true, 'applying note parameters retains focus and DOM identity')
    await click('Отменить')
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('riff-battle.riff-draft.local'))?.notes[0].start === 0)
    await page.setViewport({ width: 390, height: 844 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'mobile layout fits')
    console.log('PASS keyboard note creation, editing, undo, autosave and mobile width')

    assert.equal(await page.$$eval('svg[class*="waveform"] path', paths => paths.length), 1)
    await page.click('[aria-label="Воспроизвести рифф"]')
    await page.waitForFunction(() => window.Konva?.stages[0]?.find('.playhead-line')[0]?.x() > 5)
    const performance = await page.evaluate(async () => {
      const stage = window.Konva.stages[0]
      const cursor = stage.find('.playhead-line')[0]
      const grid = stage.find('.grid')[0]
      let gridDraws = 0
      const draw = grid.drawScene
      grid.drawScene = function (...args) { gridDraws++; return draw.apply(this, args) }
      const startX = cursor.x()
      const commits = window.__reactCommits
      let frames = 0
      await new Promise(resolve => {
        const end = performance.now() + 700
        const tick = () => { frames++; if (performance.now() < end) requestAnimationFrame(tick); else resolve() }
        requestAnimationFrame(tick)
      })
      grid.drawScene = draw
      return { frames, commits: window.__reactCommits - commits, gridDraws, moved: cursor.x() - startX, notesListening: stage.find('.notes')[0].listening() }
    })
    assert.ok(performance.moved > 0, 'cursor keeps moving')
    assert.ok(performance.commits <= 4, `React commits are not tied to animation frames: ${JSON.stringify(performance)}`)
    assert.equal(performance.gridDraws, 0)
    assert.equal(performance.notesListening, false)
    await page.click('[aria-label="Остановить рифф"]')
    await page.waitForFunction(() => !window.Konva.stages[0].find('.playhead-line').length)
    console.log('PASS playback performance', JSON.stringify(performance))
    const cachedLoading = await page.evaluate(async () => {
      const region = document.querySelector('[aria-label="Полотно гитарного риффа"]')
      let loading = false
      const observer = new MutationObserver(() => { loading ||= region.textContent.includes('Загружаем гитару…') })
      observer.observe(region, { subtree: true, childList: true, characterData: true })
      await window.__componentProps('PianoRoll').onAudition({ id: 'cached', pitch: 64, start: 0, duration: 120, velocity: 0.8 })
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      observer.disconnect()
      return loading
    })
    assert.equal(cachedLoading, false, 'cached preview never flashes a loading indicator')

    const point = await page.$eval('[aria-label="Редактор нот E2–E6"]', element => {
      const bounds = element.getBoundingClientRect()
      return { x: bounds.x + 120, y: bounds.y + 90 }
    })
    await page.mouse.click(point.x, point.y)
    await page.waitForFunction(() => document.body.innerText.includes('Нот: 2 / 512'))
    await page.mouse.move(point.x, point.y)
    await page.mouse.down()
    await page.mouse.move(point.x + 35, point.y + 20, { steps: 5 })
    await page.mouse.up()
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('riff-battle.riff-draft.local'))?.notes.length === 2)
    await click('Отменить')
    await click('Отменить')
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('riff-battle.riff-draft.local'))?.notes.length === 1)
    console.log('PASS canvas pointer creation and drag remain undoable without Konva hit graph')

    await page.evaluate(() => localStorage.setItem('riff-battle.riff-draft.local', JSON.stringify({ timbre: 'clean', notes: Array.from({ length: 512 }, (_, index) => ({ id: String(index), pitch: 64, start: 0, duration: 120, velocity: 0.8 })) })))
    await page.reload({ waitUntil: 'networkidle2' })
    await openPanel()
    await page.waitForFunction(() => document.body.innerText.includes('Достигнут лимит'))
    assert.equal(await page.$eval(`${panel} form fieldset`, element => element.disabled), true)
    await page.select(`${panel} > label select`, '0')
    assert.equal(await page.$eval(`${panel} form fieldset`, element => element.disabled), false)
    await click('Удалить выделенные ноты')
    await page.waitForFunction(() => document.body.innerText.includes('Нот: 511 / 512'))
    assert.equal(await page.$eval(`${panel} form fieldset`, element => element.disabled), false)
    console.log('PASS note limit allows editing and unlocks addition after deletion')

    await go('/rooms?query=groove&style=Metal&onlyAvailable=true&code=ABC123')
    await page.waitForSelector('input[type="search"]')
    assert.equal(await page.$eval('input[type="search"]', element => element.value), 'groove')
    await page.focus('input[type="search"]')
    await page.keyboard.press('End')
    await page.keyboard.type('123')
    await page.waitForFunction(() => new URL(location.href).searchParams.get('query') === 'groove123')
    assert.equal(new URL(page.url()).searchParams.get('code'), 'ABC123')
    await page.reload({ waitUntil: 'networkidle2' })
    await page.waitForSelector('input[type="search"]')
    assert.equal(await page.$eval('input[type="search"]', element => element.value), 'groove123')
    assert.equal(await page.$eval('input[type="checkbox"]', element => element.checked), true)
    console.log('PASS filters persist in URL, survive reload and preserve invitation')
    await joinWhileBlocked()

    await go(`/rooms/compose?roundId=${roundId}`)
    await openPanel()
    await page.focus(`${panel} form input[type="number"]`)
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.body.innerText.includes('Нот: 1 / 512'))
    failRound = true
    await page.waitForFunction(() => document.body.innerText.includes('Не удалось обновить раунд'))
    assert.ok(await page.$('[aria-label="Редактор нот E2–E6"]'))
    assert.ok(await page.$(`${panel}[open]`), 'editor was not remounted')
    failRound = false
    await click('Обновить раунд')
    await page.waitForFunction(() => !document.body.innerText.includes('Не удалось обновить раунд'))
    assert.ok(await page.evaluate(() => document.body.innerText.includes('Нот: 1 / 512')))
    console.log('PASS connection error and retry preserve mounted editor and notes')
    }

    const sampler = await page.evaluate(async () => {
      const { RiffAudioEngine } = await import('/src/features/play-riff/lib/riff-audio-engine.ts')
      const context = new AudioContext()
      const engine = new RiffAudioEngine(context)
      const signal = new AbortController().signal
      try {
        await engine.resume()
        await engine.loadSamples(signal, [64])
        const nativeFetch = window.fetch
        const decode = engine.context.decodeAudioData.bind(engine.context)
        let requests = 0, decodes = 0
        window.fetch = (...args) => { requests++; return nativeFetch(...args) }
        engine.context.decodeAudioData = (...args) => { decodes++; return decode(...args) }
        try {
          const url = '/sounds/drums/poly-120-4.wav'
          await Promise.all([engine.loadBacking(url, signal), engine.loadBacking(url, signal), engine.loadBacking(url, signal)])
          if (requests !== 1 || decodes !== 1) throw new Error(`Backing load duplicated: ${requests} requests, ${decodes} decodes`)
          if (!engine.hasSounds([64], url) || engine.hasSounds([67], url)) throw new Error('Incorrect audio cache readiness')
          await engine.loadBacking(url, signal)
          if (requests !== 1 || decodes !== 1) throw new Error('Cached backing was loaded again')
          let fail = true
          window.fetch = (...args) => fail ? (fail = false, Promise.resolve(new Response('', { status: 503 }))) : nativeFetch(...args)
          const retryUrl = url + '?retry=1'
          await engine.loadBacking(retryUrl, signal).then(() => { throw new Error('Expected failure') }, () => {})
          await engine.loadBacking(retryUrl, signal)
          if (!engine.hasSounds([64], retryUrl)) throw new Error('Failed backing request cannot be retried')
        } finally { window.fetch = nativeFetch; engine.context.decodeAudioData = decode }
        const note = { id: 'test', pitch: 64, start: 0, duration: 120, velocity: 0.8 }
        engine.preview(note)
        const original = engine.audition
        engine.preview(note)
        const sameAfterPreview = original === engine.audition
        await engine.loadSamples(signal, [67])
        engine.preview({ ...note, pitch: 67 })
        const sameAfterLoad = original === engine.audition
        engine.stop()
        engine.preview(note)
        const sameAfterStop = original === engine.audition
        engine.dispose()
        return { sameAfterPreview, sameAfterLoad, sameAfterStop, disposed: original.disposed, cleared: engine.audition === null }
      } finally { engine.dispose(); if (context.state !== 'closed') await context.close() }
    })
    assert.deepEqual(sampler, { sameAfterPreview: true, sameAfterLoad: true, sameAfterStop: true, disposed: true, cleared: true })
    console.log('PASS sampler reuse, incremental sample loading and cleanup')

    voting = true
    votingEnds = new Date(Date.now() + 12000).toISOString()
    await go(`/rooms/vote?roundId=${roundId}`)
    await page.waitForSelector('[aria-label="Риффы для голосования"]')
    const firstTimer = await page.$eval('[role="timer"]', element => element.textContent)
    await page.evaluate(() => {
      window.__votingProps = window.__componentProps('VotingList')
      if (!window.__votingProps) throw new Error('VotingList fiber not found')
    })
    await page.waitForFunction(before => document.querySelector('[role="timer"]').textContent !== before, {}, firstTimer)
    assert.equal(await page.evaluate(() => window.__votingProps === window.__componentProps('VotingList')), true, 'timer tick does not render the voting list')
    await page.waitForFunction(() => document.querySelector('[role="timer"]').textContent.includes('Время вышло'))
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent === 'Выбрать рифф' && button.disabled))
    await page.evaluate(() => window.__votingProps.onVote('riff-a'))
    assert.equal(voteRequests, 0, 'even a captured handler cannot vote after the deadline')
    console.log('PASS isolated countdown, deadline disables voting and stale handlers cannot submit')
    assert.deepEqual(errors, [])
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
