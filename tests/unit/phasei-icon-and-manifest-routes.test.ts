import { describe, expect, it, vi } from 'vitest'

const { getPublicStoreSettingsMock, getSiteBrandAssetsMock } = vi.hoisted(() => ({
	getPublicStoreSettingsMock: vi.fn(async () => ({
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
	})),
	getSiteBrandAssetsMock: vi.fn(() => ({
		faviconUrl: 'https://aurasveta.by/brand/favicon.png',
		appleIconUrl: 'https://aurasveta.by/brand/apple-touch.png',
	})),
}))

vi.mock('next/server', () => ({
	NextResponse: {
		redirect: (url: string) => ({
			status: 307,
			headers: new Headers({ location: url }),
		}),
	},
}))

vi.mock('@/lib/utils/getpublicstoresettings', () => ({
	getPublicStoreSettings: getPublicStoreSettingsMock,
}))

vi.mock('@/lib/seo/sitemetadata', async () => {
	const actual = await vi.importActual<typeof import('@/lib/seo/sitemetadata')>(
		'@/lib/seo/sitemetadata',
	)

	return {
		...actual,
		getSiteBrandAssets: getSiteBrandAssetsMock,
	}
})

describe('phase I: icon/manifest route release gates', () => {
	it('icon route отдает redirect на DB-aware favicon URL', async () => {
		const iconModule = await import('@/app/icon')
		const response = await iconModule.default()

		expect(getPublicStoreSettingsMock).toHaveBeenCalledOnce()
		expect(getSiteBrandAssetsMock).toHaveBeenCalledOnce()
		expect(response.status).toBe(307)
		expect(response.headers.get('location')).toBe(
			'https://aurasveta.by/brand/favicon.png',
		)
	})

	it('apple-icon route отдает redirect на DB-aware apple icon URL', async () => {
		const appleIconModule = await import('@/app/apple-icon')
		const response = await appleIconModule.default()

		expect(response.status).toBe(307)
		expect(response.headers.get('location')).toBe(
			'https://aurasveta.by/brand/apple-touch.png',
		)
	})

	it('manifest route отдает валидную webmanifest структуру', async () => {
		const manifestModule = await import('@/app/manifest')
		const manifest = manifestModule.default()

		expect(manifest.name).toBe('Аура Света')
		expect(manifest.icons).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					src: '/web-app-manifest-192x192.png',
				}),
				expect.objectContaining({
					src: '/web-app-manifest-512x512.png',
				}),
			]),
		)
	})
})
