import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	LEGACY_FOOTER_ABOUT_LINKS,
	LEGACY_HEADER_RIGHT_LINKS,
	LEGACY_HEADER_SERVICE_LINKS,
} from '@/shared/config/legacysitenav'

const getPublicByZoneMock = vi.hoisted(() => vi.fn())

vi.mock('server-only', () => ({}))

vi.mock('@/lib/trpc/server', () => ({
	trpc: {
		siteNav: {
			getPublicByZone: getPublicByZoneMock,
		},
	},
}))

import { getFooterAboutLinks, getTopBarNavGroups } from '@/lib/navigation/sitenav'

describe('site nav DB/fallback contract (phase H3)', () => {
	beforeEach(() => {
		getPublicByZoneMock.mockReset()
	})

	it('использует DB-backed header links без отката на legacy', async () => {
		getPublicByZoneMock.mockResolvedValueOnce([
			{ id: '1', pageId: 'p1', label: 'Каталог', href: '/catalog', order: 0 },
			{ id: '2', pageId: 'p2', label: 'Доставка и оплата', href: '/delivery', order: 1 },
			{ id: '3', pageId: 'p3', label: 'Контакты', href: '/contacts', order: 2 },
			{ id: '4', pageId: 'p4', label: 'Возврат', href: '/returns', order: 3 },
		])

		const groups = await getTopBarNavGroups()

		expect(groups.serviceLinks).toEqual([
			{ label: 'Каталог', href: '/catalog' },
			{ label: 'Доставка и оплата', href: '/delivery' },
			{ label: 'Контакты', href: '/contacts' },
		])
		expect(groups.rightLinks).toEqual([
			{ label: 'Возврат', href: '/returns' },
		])
		expect(groups.serviceLinks).not.toEqual(LEGACY_HEADER_SERVICE_LINKS)
		expect(groups.rightLinks).not.toEqual(LEGACY_HEADER_RIGHT_LINKS)
	})

	it('использует DB-backed footer links без отката на legacy', async () => {
		getPublicByZoneMock.mockResolvedValueOnce([
			{ id: 'f1', pageId: 'p1', label: 'Доставка и оплата', href: '/delivery', order: 0 },
			{ id: 'f2', pageId: 'p2', label: 'Контакты', href: '/contacts', order: 1 },
			{ id: 'f3', pageId: 'p3', label: 'Гарантия качества', href: '/warranty', order: 2 },
		])

		const links = await getFooterAboutLinks()

		expect(links).toEqual([
			{ label: 'Доставка и оплата', href: '/delivery' },
			{ label: 'Контакты', href: '/contacts' },
			{ label: 'Гарантия качества', href: '/warranty' },
		])
		expect(links).not.toEqual(LEGACY_FOOTER_ABOUT_LINKS)
	})

	it('использует legacy fallback только при пустом DB-ответе', async () => {
		getPublicByZoneMock.mockResolvedValueOnce([])
		const header = await getTopBarNavGroups()
		expect(header.serviceLinks).toEqual(LEGACY_HEADER_SERVICE_LINKS)
		expect(header.rightLinks).toEqual(LEGACY_HEADER_RIGHT_LINKS)

		getPublicByZoneMock.mockResolvedValueOnce([])
		const footer = await getFooterAboutLinks()
		expect(footer).toEqual(LEGACY_FOOTER_ABOUT_LINKS)
	})
})
