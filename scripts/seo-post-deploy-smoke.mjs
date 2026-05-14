#!/usr/bin/env node

const baseUrlArg = process.argv[2]
const baseUrl = (baseUrlArg || process.env.SEO_SMOKE_BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '')

const retryCount = Number(process.env.SEO_SMOKE_RETRIES || 5)
const retryDelayMs = Number(process.env.SEO_SMOKE_RETRY_DELAY_MS || 1500)
const requestTimeoutMs = Number(process.env.SEO_SMOKE_TIMEOUT_MS || 8000)

const checks = [
	{ path: '/', expected: [200], label: 'homepage' },
	{ path: '/catalog', expected: [200], label: 'catalog' },
	{ path: '/robots.txt', expected: [200], label: 'robots' },
	{ path: '/sitemap.xml', expected: [200], label: 'sitemap' },
	{ path: '/__seo-smoke__/non-existent-page', expected: [404], label: '404 contract' },
	{ path: '/manifest.webmanifest', expected: [200], label: 'manifest' },
	{ path: '/icon', expected: [307, 308], label: 'icon redirect' },
	{ path: '/apple-icon', expected: [307, 308], label: 'apple-icon redirect' },
]

if (process.env.SEO_SMOKE_CATEGORY_PATH) {
	checks.push({
		path: process.env.SEO_SMOKE_CATEGORY_PATH,
		expected: [200],
		label: 'category page',
	})
}

if (process.env.SEO_SMOKE_PRODUCT_PATH) {
	checks.push({
		path: process.env.SEO_SMOKE_PRODUCT_PATH,
		expected: [200],
		label: 'product page',
	})
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchStatus(url) {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)

	try {
		const res = await fetch(url, {
			method: 'GET',
			redirect: 'manual',
			signal: controller.signal,
		})
		return { ok: true, status: res.status }
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : String(error) }
	} finally {
		clearTimeout(timeout)
	}
}

let hasFailures = false

console.log(`[seo-smoke] Base URL: ${baseUrl}`)
console.log(`[seo-smoke] Retry count: ${retryCount}, timeout: ${requestTimeoutMs}ms`)

for (const check of checks) {
	const url = `${baseUrl}${check.path}`
	let success = false
	let lastStatus = 'N/A'
	let lastError = null

	for (let attempt = 1; attempt <= retryCount; attempt++) {
		const result = await fetchStatus(url)
		if (result.ok) {
			lastStatus = String(result.status)
			if (check.expected.includes(result.status)) {
				success = true
				console.log(`[seo-smoke] ✅ ${check.label} (${check.path}) -> ${result.status} on attempt ${attempt}/${retryCount}`)
				break
			}
		} else {
			lastError = result.error
		}

		if (attempt < retryCount) {
			await sleep(retryDelayMs)
		}
	}

	if (!success) {
		hasFailures = true
		const reason = lastError
			? `error: ${lastError}`
			: `status: ${lastStatus}, expected: ${check.expected.join('|')}`
		console.error(`[seo-smoke] ❌ ${check.label} (${check.path}) failed -> ${reason}`)
	}
}

if (hasFailures) {
	console.error('[seo-smoke] One or more checks failed.')
	process.exit(1)
}

console.log('[seo-smoke] All checks passed.')
