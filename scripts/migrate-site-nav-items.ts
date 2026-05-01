import { NavZone, PrismaClient, type SiteNavItem } from '@prisma/client'
import {
	LEGACY_FOOTER_ABOUT_LINKS,
	LEGACY_HEADER_RIGHT_LINKS,
	LEGACY_HEADER_SERVICE_LINKS,
	type LegacyNavLink,
} from '../shared/config/legacy-site-nav'

type ZoneReport = {
	zone: NavZone
	total: number
	migrated: number
	skipped: number
	duplicates: number
	items: Array<{
		label: string
		href: string
		slug: string | null
		status: 'migrated' | 'skipped'
		reason?: string
	}>
}

type PreparedItem = Pick<SiteNavItem, 'zone' | 'pageId' | 'order' | 'isActive' | 'labelOverride'>

const prisma = new PrismaClient()

const isApplyMode = process.argv.includes('--apply')

function hrefToSlug(href: string): string | null {
	if (!href.startsWith('/')) return null
	if (href === '/') return 'home'

	const pathWithoutQuery = href.split('?')[0]?.trim()
	if (!pathWithoutQuery) return null

	const normalized = pathWithoutQuery.replace(/^\/+|\/+$/g, '')
	if (!normalized) return null

	if (normalized.startsWith('pages/')) {
		const slug = normalized.slice('pages/'.length)
		return slug.length > 0 ? slug : null
	}

	if (normalized.includes('/')) {
		return null
	}

	return normalized
}

async function prepareZone(
	zone: NavZone,
	links: LegacyNavLink[],
): Promise<{ report: ZoneReport; prepared: PreparedItem[] }> {
	const report: ZoneReport = {
		zone,
		total: links.length,
		migrated: 0,
		skipped: 0,
		duplicates: 0,
		items: [],
	}

	const slugs = links
		.map(link => hrefToSlug(link.href))
		.filter((slug): slug is string => Boolean(slug))

	const pages = await prisma.page.findMany({
		where: {
			slug: { in: slugs },
			isPublished: true,
		},
		select: {
			id: true,
			slug: true,
			title: true,
		},
	})

	const pageBySlug = new Map(pages.map(page => [page.slug, page]))
	const usedPageIds = new Set<string>()
	const prepared: PreparedItem[] = []

	for (const link of links) {
		const slug = hrefToSlug(link.href)
		if (!slug) {
			report.skipped += 1
			report.items.push({
				label: link.label,
				href: link.href,
				slug: null,
				status: 'skipped',
				reason: 'URL не сопоставлен с CMS-страницей',
			})
			continue
		}

		const page = pageBySlug.get(slug)
		if (!page) {
			report.skipped += 1
			report.items.push({
				label: link.label,
				href: link.href,
				slug,
				status: 'skipped',
				reason: 'Опубликованная CMS-страница не найдена',
			})
			continue
		}

		if (usedPageIds.has(page.id)) {
			report.skipped += 1
			report.duplicates += 1
			report.items.push({
				label: link.label,
				href: link.href,
				slug,
				status: 'skipped',
				reason: 'Дубликат страницы внутри зоны',
			})
			continue
		}

		usedPageIds.add(page.id)
		prepared.push({
			zone,
			pageId: page.id,
			order: prepared.length,
			isActive: true,
			labelOverride: link.label !== page.title ? link.label : null,
		})
		report.migrated += 1
		report.items.push({
			label: link.label,
			href: link.href,
			slug,
			status: 'migrated',
		})
	}

	return { report, prepared }
}

function printReport(reports: ZoneReport[]) {
	console.log('')
	console.log('=== Site Navigation Migration Report ===')
	for (const report of reports) {
		console.log('---')
		console.log(`Zone: ${report.zone}`)
		console.log(`Total: ${report.total}`)
		console.log(`Migrated: ${report.migrated}`)
		console.log(`Skipped: ${report.skipped}`)
		if (report.duplicates > 0) {
			console.log(`Duplicates: ${report.duplicates}`)
		}
		for (const item of report.items) {
			const reason = item.reason ? ` (${item.reason})` : ''
			console.log(
				` - [${item.status}] ${item.label} -> ${item.href}${reason}`,
			)
		}
	}
	console.log('')
}

async function main() {
	const byZone: Record<NavZone, LegacyNavLink[]> = {
		HEADER: [...LEGACY_HEADER_SERVICE_LINKS, ...LEGACY_HEADER_RIGHT_LINKS],
		FOOTER: LEGACY_FOOTER_ABOUT_LINKS,
	}

	const zoneOrder: NavZone[] = ['HEADER', 'FOOTER']
	const preparedByZone = await Promise.all(
		zoneOrder.map(zone => prepareZone(zone, byZone[zone])),
	)

	const reports = preparedByZone.map(item => item.report)
	printReport(reports)

	if (!isApplyMode) {
		console.log('Dry-run completed. Добавьте --apply для сохранения изменений.')
		return
	}

	await prisma.$transaction(async tx => {
		for (const zone of zoneOrder) {
			await tx.siteNavItem.deleteMany({ where: { zone } })
		}
		for (const { prepared } of preparedByZone) {
			if (prepared.length === 0) continue
			await tx.siteNavItem.createMany({ data: prepared })
		}
	})

	console.log('Migration applied successfully.')
}

main()
	.catch(error => {
		console.error('Navigation migration failed:', error)
		process.exitCode = 1
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
