const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')

const OUTPUT_DIR = path.join(process.cwd(), 'screenshots')

const urls = {
	home: 'https://donplafon.ru/',
	catalog: 'https://donplafon.ru/catalog/lyustry/',
	product:
		'https://donplafon.ru/products/podvesnaya_lyustra_aployt_pietro_apl_094_03_80/',
}

function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true })
	}
}

async function dismissConsent(page) {
	const candidates = [
		'button:has-text("ОК")',
		'button:has-text("Принять")',
		'button:has-text("Согласен")',
		'text=ОК',
		'text=Принять',
	]

	for (const selector of candidates) {
		const locator = page.locator(selector).first()
		if ((await locator.count()) > 0) {
			try {
				await locator.click({ timeout: 1500 })
				return
			} catch {
				// ignore and try next selector
			}
		}
	}
}

async function preparePage(page, url, viewport) {
	await page.setViewportSize(viewport)
	await page.emulateMedia({ reducedMotion: 'reduce' })
	await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
	await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
	await dismissConsent(page)
	await page.waitForTimeout(1500)
}

async function capture() {
	ensureDir(OUTPUT_DIR)

	const browser = await chromium.launch({ headless: true })
	const context = await browser.newContext({
		locale: 'ru-RU',
		colorScheme: 'light',
		deviceScaleFactor: 1,
	})
	const page = await context.newPage()

	try {
		await preparePage(page, urls.home, { width: 1920, height: 1080 })
		await page.screenshot({
			path: path.join(OUTPUT_DIR, '01-homepage-full.png'),
			fullPage: true,
		})

		await preparePage(page, urls.catalog, { width: 1920, height: 1080 })
		await page.locator('text=Найдено').first().scrollIntoViewIfNeeded().catch(() => {})
		await page.waitForTimeout(800)
		await page.screenshot({
			path: path.join(OUTPUT_DIR, '02-catalog-grid.png'),
			fullPage: false,
		})

		await preparePage(page, urls.product, { width: 1920, height: 1080 })
		await page.locator('h1').first().scrollIntoViewIfNeeded().catch(() => {})
		await page.waitForTimeout(800)
		await page.screenshot({
			path: path.join(OUTPUT_DIR, '03-product-card.png'),
			fullPage: false,
		})

		await preparePage(page, urls.home, { width: 375, height: 667 })
		await page.screenshot({
			path: path.join(OUTPUT_DIR, '04-mobile-home.png'),
			fullPage: true,
		})

		const files = fs.readdirSync(OUTPUT_DIR).sort()
		console.log('Captured screenshots:')
		for (const file of files) {
			console.log(`- ${path.join('screenshots', file)}`)
		}
	} finally {
		await browser.close()
	}
}

capture().catch(error => {
	console.error(error)
	process.exitCode = 1
})
