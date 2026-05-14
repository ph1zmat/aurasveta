import { describe, expect, it } from 'vitest'
import {
	buildRootMetadata,
	buildSiteManifest,
	getSiteBrandAssets,
} from '@/lib/seo/sitemetadata'

describe('site metadata helpers', () => {
	it('buildRootMetadata uses DB-backed favicon/logo when provided', () => {
		const metadata = buildRootMetadata({
			phone: '+375291112233',
			additionalPhone: null,
			email: 'info@aurasveta.by',
			address: 'ул. Пример, 1',
			city: 'Мозырь',
			postalCode: '247760',
			workingHours: {},
			socialLinks: [],
			logoUrl: '/brand/logo.png',
			faviconUrl: '/brand/favicon.png',
		})

		expect(metadata.manifest).toBe('/manifest.webmanifest')
		expect(metadata.openGraph?.images).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					url: 'https://aurasveta.by/brand/logo.png',
				}),
			]),
		)
		expect(metadata.twitter?.images).toEqual([
			'https://aurasveta.by/brand/logo.png',
		])
	})

	it('getSiteBrandAssets uses real fallback assets when DB values are missing', () => {
		const assets = getSiteBrandAssets(null)

		expect(assets.logoUrl).toBe(
			'https://aurasveta.by/auralogonolineprimary.png',
		)
		expect(assets.faviconUrl).toBe(
			'https://aurasveta.by/favicon-96x96.png',
		)
		expect(assets.appleIconUrl).toBe(
			'https://aurasveta.by/web-app-manifest-192x192.png',
		)
	})

	it('buildSiteManifest points to existing app icon files', () => {
		const manifest = buildSiteManifest()

		expect(manifest.icons).toEqual([
			{
				src: '/web-app-manifest-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/web-app-manifest-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
		])
	})
})
