import { loadEnvConfig } from '@next/env'
import type { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

const isApplyMode = process.argv.includes('--apply')

async function main() {
	loadEnvConfig(process.cwd())
	const prismaModule = await import('../lib/prisma')
	prisma = prismaModule.prisma

	console.log('=== Fix "Магизины" в навигации ===')
	console.log(`Режим: ${isApplyMode ? 'APPLY' : 'DRY-RUN'}`)

	const items = await prisma.siteNavItem.findMany({
		where: {
			OR: [
				{ labelOverride: { contains: 'агизин', mode: 'insensitive' } },
				{ page: { slug: { contains: 'magizin', mode: 'insensitive' } } },
			],
		},
		include: {
			page: { select: { id: true, title: true, slug: true } },
		},
	})

	if (items.length === 0) {
		console.log('Опечаток "Магизины" в SiteNavItem не найдено.')
		return
	}

	console.log(`Найдено записей: ${items.length}`)
	for (const item of items) {
		console.log(
			` - ${item.zone}: "${item.labelOverride ?? item.page.title}" → /${item.page.slug} [id=${item.id}]`,
		)
	}

	if (!isApplyMode) {
		console.log('\nDry-run завершён. Для применения добавьте флаг --apply.')
		return
	}

	// Обновляем labelOverride для записей с опечаткой в label
	const labelResult = await prisma.siteNavItem.updateMany({
		where: {
			labelOverride: { contains: 'агизин', mode: 'insensitive' },
		},
		data: { labelOverride: 'Наши магазины' },
	})

	// Обновляем page.slug для записей с опечаткой в slug
	const pageResult = await prisma.page.updateMany({
		where: {
			slug: { contains: 'magizin', mode: 'insensitive' },
		},
		data: { slug: 'stores' },
	})

	console.log(`Исправлено labelOverride: ${labelResult.count}`)
	console.log(`Исправлено page.slug: ${pageResult.count}`)
}

main()
	.catch((error) => {
		console.error('Fix failed:', error)
		process.exitCode = 1
	})
	.finally(async () => {
		await prisma?.$disconnect()
	})
