import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/lib/utils/getpublicstoresettings', () => ({
	getPublicStoreSettings: vi.fn(async () => ({
		phone: '+375291112233',
		additionalPhone: null,
		email: 'info@aurasveta.by',
		address: 'ул. Пример, 1',
		city: 'Мозырь',
		postalCode: '247760',
		workingHours: {},
		socialLinks: [{ platform: 'instagram', url: 'https://instagram.com/aura' }],
		logoUrl: '/images/logo.png',
		faviconUrl: '/favicon-96x96.png',
	})),
}))

vi.mock('@/lib/trpc/client', () => ({
	TRPCProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/lib/trpc/server', () => ({
	HydrateClient: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/shared/ui/rootthemeprovider', () => ({
	default: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/shared/ui/toaster', () => ({
	default: () => null,
}))

vi.mock('@/widgets/header/ui/mobileheader', () => ({
	default: () => null,
}))

vi.mock('@/widgets/navigation/ui/mobilebottomnav', () => ({
	default: () => null,
}))

vi.mock('@/widgets/header/ui/topbar', () => ({
	default: () => null,
}))

vi.mock('@/widgets/header/ui/headerserver', () => ({
	default: () => null,
}))

vi.mock('@/widgets/navigation/ui/categorynav', () => ({
	default: () => null,
}))

vi.mock('@/widgets/footer/ui/footer', () => ({
	default: () => null,
}))

describe('phase G: layout SSR schema presence', () => {
	it('рендерит Organization и WebSite JSON-LD в layout head', async () => {
		const layoutModule = await import('@/app/layout')
		const element = await layoutModule.default({
			children: null,
		})
		const html = renderToStaticMarkup(element)

		expect(html).toContain('application/ld+json')
		expect(html).toContain('"@type":"Organization"')
		expect(html).toContain('"@type":"WebSite"')
		expect(html).toContain('"SearchAction"')
	})
})
