import { readFile } from 'node:fs/promises'

const thresholds = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
}

const reportPath = process.argv[2] ?? 'lighthouse-report.report.json'
const report = JSON.parse(await readFile(reportPath, 'utf8'))

if (report.runtimeError) {
  console.error('Lighthouse audit failed:', report.runtimeError.message)
  process.exitCode = 1
}

for (const [category, threshold] of Object.entries(thresholds)) {
  const score = report.categories?.[category]?.score
  if (!Number.isFinite(score) || score < 0 || score > 1) {
    console.error(`${category}: missing or invalid score`)
    process.exitCode = 1
    continue
  }

  const passed = score >= threshold / 100
  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${category}: ${(score * 100).toFixed(1)}/100 (minimum ${threshold})`,
  )
  if (!passed) process.exitCode = 1
}
