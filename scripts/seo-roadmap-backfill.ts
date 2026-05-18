import { generateCategorySeo, generateProductSeo } from '../shared/lib/seo/generateseo'
import { mergeWithMode } from '../lib/seo/domain/merge'
import { normalizeSeoFields, upsertSeoMetadata } from '../lib/seo/metadatapersistence'
import { loadEnvConfig } from '@next/env'
import type { PrismaClient } from '@prisma/client'
import { DEPRECATED_NAV_PAGE_SLUGS_SET } from '../shared/config/deprecated-nav-page-slugs'

type SeoTargetType = 'category' | 'product'

type BackfillStats = {
	processed: number
	changed: number
	errors: number
}

let prisma: PrismaClient

const isApplyMode = process.argv.includes('--apply')

function printHeader(title: string) {
	console.log('')
	console.log(`=== ${title} ===`)
}

function getChangedFieldNames(
	before: ReturnType<typeof normalizeSeoFields> | null,
	after: ReturnType<typeof normalizeSeoFields>,
) {
	const fields = Object.keys(after) as Array<keyof ReturnType<typeof normalizeSeoFields>>
	return fields.filter(field => (before?.[field] ?? null) !== after[field])
}

async function cleanupDeprecatedNav() {
	const allNavItems = await prisma.siteNavItem.findMany({
		include: {
			page: {
				select: {
					id: true,
					title: true,
					slug: true,
				},
			},
		},
	})

	const deprecatedItems = allNavItems.filter(item => DEPRECATED_NAV_PAGE_SLUGS_SET.has(item.page.slug))

	printHeader('Пункт 9: Cleanup deprecated nav links')
	console.log(`Найдено deprecated nav items: ${deprecatedItems.length}`)

	for (const item of deprecatedItems) {
		console.log(
			` - ${item.zone}: ${item.page.title} (/${item.page.slug}) [id=${item.id}]`,
		)
	}

	if (!isApplyMode || deprecatedItems.length === 0) {
		return { found: deprecatedItems.length, removed: 0 }
	}

	const result = await prisma.siteNavItem.deleteMany({
		where: {
			id: {
				in: deprecatedItems.map(item => item.id),
			},
		},
	})

	console.log(`Удалено deprecated nav items: ${result.count}`)
	return { found: deprecatedItems.length, removed: result.count }
}

async function loadExistingSeoMap(targetType: SeoTargetType, targetIds: string[]) {
	const existingSeo = await prisma.seoMetadata.findMany({
		where: {
			targetType,
			targetId: { in: targetIds },
		},
	})

	return new Map(
		existingSeo.map(item => [
			item.targetId,
			normalizeSeoFields({
				title: item.title,
				description: item.description,
				keywords: item.keywords,
				ogTitle: item.ogTitle,
				ogDescription: item.ogDescription,
				ogImage: item.ogImage,
				canonicalUrl: item.canonicalUrl,
				noIndex: item.noIndex,
			}),
		]),
	)
}

async function backfillTopCategories(): Promise<BackfillStats> {
	printHeader('Пункт 11: Backfill descriptions для всех категорий')

	const grouped = await prisma.product.groupBy({
		by: ['categoryId'],
		where: {
			isActive: true,
			categoryId: { not: null },
		},
		_count: {
			_all: true,
		},
		orderBy: {
			_count: {
				categoryId: 'desc',
			},
		},
	})

	const categoryIds = grouped.map(item => item.categoryId).filter((id): id is string => Boolean(id))
	if (categoryIds.length === 0) {
		console.log('Категории для backfill не найдены.')
		return { processed: 0, changed: 0, errors: 0 }
	}

	const categories = await prisma.category.findMany({
		where: {
			id: { in: categoryIds },
		},
		select: {
			id: true,
			name: true,
			description: true,
			image: true,
			imagePath: true,
		},
	})

	const countByCategoryId = new Map(grouped.map(item => [item.categoryId as string, item._count._all]))
	const orderedCategories = [...categories].sort((a, b) => {
		return (countByCategoryId.get(b.id) ?? 0) - (countByCategoryId.get(a.id) ?? 0)
	})

	const existingSeoMap = await loadExistingSeoMap('category', orderedCategories.map(c => c.id))

	let changed = 0
	let errors = 0

	for (const category of orderedCategories) {
		try {
			const generated = generateCategorySeo({
				name: category.name,
				description: category.description,
				images: category.imagePath || category.image ? [{ url: category.imagePath ?? category.image }] : undefined,
			})

			const existing = existingSeoMap.get(category.id) ?? null
			const merged = mergeWithMode(generated, existing, 'strict')
			const changedFields = getChangedFieldNames(existing, merged)

			if (changedFields.length === 0) {
				continue
			}

			console.log(` - ${category.name}: ${changedFields.join(', ')}`)
			changed += 1

			if (isApplyMode) {
				await upsertSeoMetadata(prisma, {
					targetType: 'category',
					targetId: category.id,
					fields: merged,
				})
			}
		} catch (error) {
			errors += 1
			console.error(` ! Ошибка категории ${category.name}:`, error)
		}
	}

	console.log(`Категории обработано: ${orderedCategories.length}, изменено: ${changed}, ошибок: ${errors}`)
	return { processed: orderedCategories.length, changed, errors }
}

async function backfillTopProducts(): Promise<BackfillStats> {
	printHeader('Пункт 12: Backfill descriptions для всех товаров')

	const products = await prisma.product.findMany({
		where: {
			isActive: true,
		},
		orderBy: [{ reviewsCount: 'desc' }, { updatedAt: 'desc' }],
		select: {
			id: true,
			name: true,
			description: true,
			price: true,
			brand: true,
			metaTitle: true,
			metaDesc: true,
			images: {
				orderBy: { order: 'asc' },
				take: 1,
				select: { url: true },
			},
			category: {
				select: {
					name: true,
				},
			},
		},
	})

	if (products.length === 0) {
		console.log('Товары для backfill не найдены.')
		return { processed: 0, changed: 0, errors: 0 }
	}

	const existingSeoMap = await loadExistingSeoMap('product', products.map(p => p.id))

	let changed = 0
	let errors = 0

	for (const product of products) {
		try {
			const generated = generateProductSeo({
				name: product.name,
				description: product.description,
				price: product.price,
				brand: product.brand,
				categoryName: product.category?.name,
				images: product.images,
			})

			const generatedWithLegacy = {
				...generated,
				title: generated.title ?? product.metaTitle ?? null,
				description: generated.description ?? product.metaDesc ?? null,
			}

			const existing = existingSeoMap.get(product.id) ?? null
			const merged = mergeWithMode(generatedWithLegacy, existing, 'strict')
			const changedFields = getChangedFieldNames(existing, merged)

			if (changedFields.length === 0) {
				continue
			}

			console.log(` - ${product.name}: ${changedFields.join(', ')}`)
			changed += 1

			if (isApplyMode) {
				await upsertSeoMetadata(prisma, {
					targetType: 'product',
					targetId: product.id,
					fields: merged,
				})
			}
		} catch (error) {
			errors += 1
			console.error(` ! Ошибка товара ${product.name}:`, error)
		}
	}

	console.log(`Товары обработано: ${products.length}, изменено: ${changed}, ошибок: ${errors}`)
	return { processed: products.length, changed, errors }
}

async function main() {
	loadEnvConfig(process.cwd())
	const prismaModule = await import('../lib/prisma')
	prisma = prismaModule.prisma

	printHeader('SEO Roadmap Backfill')
	console.log(`Режим: ${isApplyMode ? 'APPLY' : 'DRY-RUN'}`)
	console.log('Режим обработки: без лимитов (все подходящие категории и товары)')

	const navResult = await cleanupDeprecatedNav()
	const categoryResult = await backfillTopCategories()
	const productResult = await backfillTopProducts()

	printHeader('Итоги')
	console.log(
		`Nav deprecated: найдено ${navResult.found}, удалено ${navResult.removed}`,
	)
	console.log(
		`Категории: обработано ${categoryResult.processed}, изменено ${categoryResult.changed}, ошибок ${categoryResult.errors}`,
	)
	console.log(
		`Товары: обработано ${productResult.processed}, изменено ${productResult.changed}, ошибок ${productResult.errors}`,
	)

	if (!isApplyMode) {
		console.log('')
		console.log('Dry-run завершён. Для применения добавьте флаг --apply.')
	}
}

main()
	.catch(error => {
		console.error('SEO roadmap backfill failed:', error)
		process.exitCode = 1
	})
	.finally(async () => {
		await prisma.$disconnect()
	})