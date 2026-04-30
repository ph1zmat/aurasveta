/**
 * Скрипт заполнения начальных данных навигации сайта.
 *
 * Читает существующие Page-записи из БД и автоматически распределяет их
 * по зонам навигации на основе slug-паттернов. Без хардкода страниц —
 * только паттерны назначения.
 *
 * Запуск: npx tsx scripts/seed-site-nav.ts
 * Dry-run (без записи): npx tsx scripts/seed-site-nav.ts --dry-run
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Загружаем .env из корня проекта
config({ path: resolve(process.cwd(), '.env') })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, SiteNavZone } from '@prisma/client'

function createClient() {
	const connectionString = process.env.DATABASE_URL
	if (!connectionString) throw new Error('DATABASE_URL is not set')
	const url = new URL(connectionString)
	if (!url.searchParams.has('connection_limit')) {
		url.searchParams.set('connection_limit', '1')
	}
	const adapter = new PrismaPg(url.toString())
	return new PrismaClient({ adapter })
}

const prisma = createClient()

// ─── Правила назначения по slug-паттернам ────────────────────────────────────

type ZoneRule = {
	zone: SiteNavZone
	slugPatterns: RegExp[]
}

const ZONE_RULES: ZoneRule[] = [
	{
		zone: 'HEADER_TOP_LEFT',
		slugPatterns: [
			/^delivery/,
			/^dostavka/,
			/^payment/,
			/^oplata/,
			/^contacts?$/,
			/^kontakty?$/,
			/^about/,
			/^o-nas/,
			/^o-magazine?/,
			/^stores?/,
			/^magaziny?/,
		],
	},
	{
		zone: 'HEADER_TOP_RIGHT',
		slugPatterns: [
			/^wholesale/,
			/^optom/,
			/^partners?/,
			/^partnyory?/,
			/^designer/,
			/^dizajner/,
			/^b2b/,
		],
	},
	{
		zone: 'FOOTER_ABOUT',
		slugPatterns: [
			/^about/,
			/^o-nas/,
			/^o-magazine?/,
			/^contacts?$/,
			/^kontakty?$/,
			/^delivery/,
			/^dostavka/,
			/^payment/,
			/^oplata/,
			/^warranty/,
			/^garantiya?/,
			/^stores?/,
			/^magaziny?/,
		],
	},
	{
		zone: 'FOOTER_SERVICE',
		slugPatterns: [
			/^assembly/,
			/^sborka/,
			/^service/,
			/^servis/,
			/^return/,
			/^vozvrat/,
			/^exchange/,
			/^obmen/,
			/^wholesale/,
			/^optom/,
			/^partners?/,
			/^partnyory?/,
			/^repair/,
			/^remont/,
		],
	},
	{
		zone: 'FOOTER_BRANDS',
		slugPatterns: [
			/^brand/,
			/^brend/,
			/^catalog/,
			/^katalog/,
			/^collection/,
			/^kollekciy/,
		],
	},
]

function matchZones(slug: string): SiteNavZone[] {
	const matched: SiteNavZone[] = []
	for (const rule of ZONE_RULES) {
		if (rule.slugPatterns.some(re => re.test(slug))) {
			matched.push(rule.zone)
		}
	}
	return matched
}

async function main() {
	const isDryRun = process.argv.includes('--dry-run')

	console.log(`\n🔍 Загрузка страниц из БД...`)

	const pages = await prisma.page.findMany({
		where: {
			isSystem: false,
			status: { in: ['PUBLISHED', 'DRAFT'] },
		},
		select: { id: true, title: true, slug: true, status: true },
		orderBy: { title: 'asc' },
	})

	console.log(`Найдено страниц: ${pages.length}`)

	// Собираем назначения
	const assignments: Array<{
		page: (typeof pages)[number]
		zones: SiteNavZone[]
	}> = []
	const unmatched: typeof pages = []

	for (const page of pages) {
		const zones = matchZones(page.slug)
		if (zones.length > 0) {
			assignments.push({ page, zones })
		} else {
			unmatched.push(page)
		}
	}

	console.log(`\n📋 Назначения по зонам:`)
	for (const { page, zones } of assignments) {
		console.log(
			`  [${page.status}] "${page.title}" (/${page.slug}) → ${zones.join(', ')}`,
		)
	}

	if (unmatched.length > 0) {
		console.log(
			`\n⚠️  Не попали ни в одну зону (добавьте вручную через админ):`,
		)
		for (const p of unmatched) {
			console.log(`  [${p.status}] "${p.title}" (/${p.slug})`)
		}
	}

	if (isDryRun) {
		console.log(
			`\n🔒 Dry-run — запись в БД пропущена. Запустите без --dry-run для применения.`,
		)
		return
	}

	// Применяем назначения
	console.log(`\n💾 Запись в БД...`)

	let created = 0
	let skipped = 0

	for (const { page, zones } of assignments) {
		for (const zone of zones) {
			// Вычисляем order: количество уже существующих в этой зоне
			const existing = await prisma.siteNavItem.findFirst({
				where: { pageId: page.id, zone },
			})

			if (existing) {
				console.log(`  ⏭  Уже существует: "${page.title}" в ${zone}`)
				skipped++
				continue
			}

			const orderCount = await prisma.siteNavItem.count({ where: { zone } })

			await prisma.siteNavItem.create({
				data: {
					pageId: page.id,
					zone,
					order: orderCount,
					isVisible: true,
				},
			})

			console.log(
				`  ✅ Добавлено: "${page.title}" → ${zone} (order: ${orderCount})`,
			)
			created++
		}
	}

	console.log(
		`\n✨ Готово! Создано: ${created}, пропущено (уже есть): ${skipped}`,
	)
}

main()
	.catch(e => {
		console.error('Ошибка:', e)
		process.exit(1)
	})
	.finally(() => prisma.$disconnect())
