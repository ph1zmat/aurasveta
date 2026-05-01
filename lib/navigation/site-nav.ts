import 'server-only'

import { trpc } from '@/lib/trpc/server'
import {
	LEGACY_FOOTER_ABOUT_LINKS,
	LEGACY_HEADER_RIGHT_LINKS,
	LEGACY_HEADER_SERVICE_LINKS,
	type LegacyNavLink,
} from '@/shared/config/legacy-site-nav'

export type SiteNavLink = {
	id: string
	pageId: string
	label: string
	href: string
	order: number
}

export async function getSiteNavLinksByZone(
	zone: 'HEADER' | 'FOOTER',
): Promise<SiteNavLink[]> {
	try {
		return await trpc.siteNav.getPublicByZone({ zone })
	} catch {
		return []
	}
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
