import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	LEGACY_FOOTER_ABOUT_LINKS,
	LEGACY_HEADER_RIGHT_LINKS,
	LEGACY_HEADER_SERVICE_LINKS,
} from '@/shared/config/legacysitenav'

const siteNavItemMock = vi.hoisted(() => ({
	findMany: vi.fn(),
}))

vi.mock('server-only', () => ({}))

vi.mock('@/lib/prisma', () => ({
	prisma: {
		siteNavItem: siteNavItemMock,
	},
}))

import { getFooterAboutLinks, getTopBarNavGroups } from '@/lib/navigation/sitenav'

describe('site nav DB/fallback contract (phase H3)', () => {
	beforeEach(() => {
		siteNavItemMock.findMany.mockReset()
	})

	it('использует DB-backed header links без отката на legacy', async () => {
		siteNavItemMock.findMany.mockResolvedValueOnce([
			{
				id: '1',
				pageId: 'p1',
				labelOverride: 'Каталог',
				page: { id: 'p1', title: 'Каталог', slug: 'catalog' },
				order: 0,
			},
			{
				id: '2',
				pageId: 'p2',
				labelOverride: 'Доставка и оплата',
				page: { id: 'p2', title: 'Доставка и оплата', slug: 'delivery' },
				order: 1,
			},
			{
				id: '3',
				pageId: 'p3',
				labelOverride: 'Контакты',
				page: { id: 'p3', title: 'Контакты', slug: 'contacts' },
				order: 2,
			},
			{
				id: '4',
				pageId: 'p4',
				labelOverride: 'Возврат',
				page: { id: 'p4', title: 'Возврат', slug: 'returns' },
				order: 3,
			},
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
		siteNavItemMock.findMany.mockResolvedValueOnce([
			{
				id: 'f1',
				pageId: 'p1',
				labelOverride: 'Доставка и оплата',
				page: { id: 'p1', title: 'Доставка и оплата', slug: 'delivery' },
				order: 0,
			},
			{
				id: 'f2',
				pageId: 'p2',
				labelOverride: 'Контакты',
				page: { id: 'p2', title: 'Контакты', slug: 'contacts' },
				order: 1,
			},
			{
				id: 'f3',
				pageId: 'p3',
				labelOverride: 'Гарантия качества',
				page: { id: 'p3', title: 'Гарантия качества', slug: 'warranty' },
				order: 2,
			},
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
		siteNavItemMock.findMany.mockResolvedValueOnce([])
		const header = await getTopBarNavGroups()
		expect(header.serviceLinks).toEqual(LEGACY_HEADER_SERVICE_LINKS)
		expect(header.rightLinks).toEqual(LEGACY_HEADER_RIGHT_LINKS)

		siteNavItemMock.findMany.mockResolvedValueOnce([])
		const footer = await getFooterAboutLinks()
		expect(footer).toEqual(LEGACY_FOOTER_ABOUT_LINKS)
	})
})
