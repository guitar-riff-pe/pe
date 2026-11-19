const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { spawn } = require('node:child_process')

// Run `pnpm build` and start Storybook on port 6007 (or set STORYBOOK_URL) first.
// Use --pages-only to check production error pages without Storybook.
// This check starts and stops its own production server on port 3108.
async function main() {
  const workspace = path.resolve(__dirname, '../../..')
  const packages = path.join(workspace, 'node_modules/.pnpm')
  const installed = fs.readdirSync(packages).find(name => name.startsWith('puppeteer-core@'))
  const { default: puppeteer } = await import(pathToFileURL(path.join(packages, installed, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
  const server = spawn(process.execPath, [path.join(workspace, 'frontend/.output/server/index.mjs')], {
    env: { ...process.env, PORT: '3108', HOST: '127.0.0.1', API_INTERNAL_URL: 'http://127.0.0.1:1/api/v1' }, windowsHide: true, stdio: 'ignore',
  })
  let browser
  try {
    let ready = false
    for (let i = 0; i < 60; i++) {
      try { await fetch('http://127.0.0.1:3108/login'); ready = true; break } catch { /* Wait for the server. */ }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    assert.ok(ready, 'Production server starts')
    browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, pipe: true })
    const page = await browser.newPage()
    page.setDefaultTimeout(60000)
    const storybook = process.env.STORYBOOK_URL || 'http://127.0.0.1:6007'
    const story = id => page.goto(`${storybook}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle0', timeout: 120000 })
    const click = text => page.evaluate(text => {
      const button = [...document.querySelectorAll('button')].find(item => item.textContent === text)
      if (!button) throw new Error(`Missing button: ${text}`)
      button.click()
    }, text)

    if (!process.argv.includes('--pages-only')) {
    await story('shared-errorboundary--recovery')
    await page.waitForSelector('[role="alert"]')
    await click('Попробовать снова')
    await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent === 'Раздел снова работает')
    assert.equal(await page.$('[role="alert"]'), null)
    await story('shared-errorboundary--recovery')
    await page.waitForSelector('[role="alert"]')
    await click('Перейти в другой раздел')
    await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent === 'Раздел снова работает')

    await story('shared-errorstate--network')
    await page.waitForSelector('[role="alert"] img')
    for (const width of [1440, 390]) {
      await page.setViewport({ width, height: 900 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      assert.ok(await page.$eval('img', image => image.complete && image.naturalWidth > 0))
    }
    if (process.env.ERROR_PREVIEW_PATH) await page.screenshot({ path: process.env.ERROR_PREVIEW_PATH })
    }

    let blockChunks = false
    let backendAvailable = false
    await page.setViewport({ width: 1440, height: 900 })
    await page.setRequestInterception(true)
    page.on('request', request => {
      const url = new URL(request.url())
      if (url.pathname.startsWith('/api/v1')) {
        if (!backendAvailable) return request.abort('failed')
        return request.respond({ status: 200, contentType: 'application/json', headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:3108', 'Access-Control-Allow-Credentials': 'true',
        }, body: JSON.stringify({ id: 'test-player', nickname: 'Гость', kind: 'guest' }) })
      }
      if (blockChunks && /\/route\.lazy-.*\.js$/.test(url.pathname)) return request.abort('failed')
      return request.continue()
    })
    await page.goto('http://127.0.0.1:3108/login', { waitUntil: 'networkidle0' })
    blockChunks = true
    await page.click('header nav a[href="/rooms"]')
    await page.waitForFunction(() => document.querySelector('main [role="alert"] h1')?.textContent === 'Не удалось загрузить страницу')
    assert.equal(await page.$$eval('body > div > header', nodes => nodes.length), 1)
    assert.equal(await page.$$eval('body > div > footer', nodes => nodes.length), 1)
    blockChunks = false
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), click('Обновить страницу')])
    await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Не удалось связаться с сервером'))
    assert.ok(!await page.$eval('main', node => node.textContent.includes('Network Error')))
    for (const width of [1440, 390]) {
      await page.setViewport({ width, height: 900 })
      for (const route of ['/missing-error-page', '/profile', '/rooms', '/rooms/create', '/rooms/lobby', '/rooms/compose?roundId=test-round', '/rooms/vote', '/rooms/results']) {
        const response = await page.goto(`http://127.0.0.1:3108${route}`, { waitUntil: 'networkidle0' })
        await page.waitForSelector('main [role="alert"] img', { timeout: 15000 }).catch(async error => {
          throw new Error(`${width} ${route}: ${await page.$eval('body', node => node.innerText)}`, { cause: error })
        })
        if (route === '/missing-error-page') {
          assert.equal(response.status(), 404)
          assert.ok(await page.$eval('main', node => node.textContent.includes('404')))
        } else {
          assert.ok(await page.$eval('main', node => node.textContent.includes('Не удалось связаться с сервером')), route)
        }
        assert.ok(await page.$eval('main [role="alert"] img', image => image.complete && image.naturalWidth > 0), route)
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width} ${route}`)
      }
    }
    await page.goto('http://127.0.0.1:3108/profile', { waitUntil: 'networkidle0' })
    await page.waitForSelector('main [role="alert"] img')
    backendAvailable = true
    await click('Попробовать снова')
    await page.waitForFunction(() => document.querySelector('main')?.textContent.includes('Статистика и история доступны'))
    assert.equal(await page.$('main [role="alert"] img'), null)
    console.log('Passed: lazy-load recovery; cat on 404 and 7 unavailable-backend pages on desktop/mobile; profile retry after backend recovery.')
  } finally {
    await browser?.close()
    server.kill()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
