import 'server-only'

import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
	LEGACY_FOOTER_ABOUT_LINKS,
	LEGACY_HEADER_RIGHT_LINKS,
	LEGACY_HEADER_SERVICE_LINKS,
	type LegacyNavLink,
} from '@/shared/config/legacysitenav'
import { DEPRECATED_NAV_PAGE_SLUGS_SET } from '@/shared/config/deprecated-nav-page-slugs'

export type SiteNavLink = {
	id: string
	pageId: string
	label: string
	href: string
	order: number
}

async function fetchSiteNavLinksByZone(
	zone: 'HEADER' | 'FOOTER',
): Promise<SiteNavLink[]> {
	try {
		const items = await prisma.siteNavItem.findMany({
			where: {
				zone,
				isActive: true,
				page: { isPublished: true },
			},
			orderBy: { order: 'asc' },
			include: {
				page: { select: { id: true, title: true, slug: true } },
			},
		})

		return items
			.filter(item => !DEPRECATED_NAV_PAGE_SLUGS_SET.has(item.page.slug))
			.map(item => ({
				id: item.id,
				pageId: item.pageId,
				label: item.labelOverride ?? item.page.title,
				href: `/${item.page.slug}`,
				order: item.order,
			}))
	} catch {
		return []
	}
}

const getSiteNavLinksByZoneCached = (zone: 'HEADER' | 'FOOTER') =>
	unstable_cache(
		async () => fetchSiteNavLinksByZone(zone),
		[`site-nav-${zone}`],
		{ revalidate: 600 },
	)()

export async function getSiteNavLinksByZone(
	zone: 'HEADER' | 'FOOTER',
): Promise<SiteNavLink[]> {
	return getSiteNavLinksByZoneCached(zone)
}

export async function getTopBarNavGroups(): Promise<{
	serviceLinks: LegacyNavLink[]
	rightLinks: LegacyNavLink[]
}> {
	const dbLinks = await getSiteNavLinksByZone('HEADER')
	if (dbLinks.length === 0) {
		return {
			serviceLinks: LEGACY_HEADER_SERVICE_LINKS,
			rightLinks: LEGACY_HEADER_RIGHT_LINKS,
		}
	}

	const links = dbLinks.map(link => ({ label: link.label, href: link.href }))
	return {
		serviceLinks: links.slice(0, 3),
		rightLinks: links.slice(3),
	}
}

export async function getFooterAboutLinks(): Promise<LegacyNavLink[]> {
	const dbLinks = await getSiteNavLinksByZone('FOOTER')
	if (dbLinks.length === 0) {
		return LEGACY_FOOTER_ABOUT_LINKS
	}
	return dbLinks.map(link => ({ label: link.label, href: link.href }))
}
