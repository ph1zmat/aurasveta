import { describe, expect, it } from 'vitest'
import nextConfig from '../../nextconfig'

describe('next config seo headers', () => {
	it('задаёт HSTS в глобальных security headers', async () => {
		if (!nextConfig.headers) {
			throw new Error('nextConfig.headers не определён')
		}

		const headers = await nextConfig.headers()
		const globalEntry = headers.find(item => item.source === '/(.*)')
		expect(globalEntry).toBeDefined()
		expect(globalEntry?.headers).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					key: 'Strict-Transport-Security',
					value: 'max-age=31536000; includeSubDomains; preload',
				}),
			]),
		)
	})

	it('ставит X-Robots-Tag для служебных и auth страниц', async () => {
		if (!nextConfig.headers) {
			throw new Error('nextConfig.headers не определён')
		}

		const headers = await nextConfig.headers()
		const expectedSources = [
			'/cart',
			'/favorites',
			'/compare',
			'/search',
			'/login',
			'/register',
			'/forbidden',
		]

		for (const source of expectedSources) {
			const entry = headers.find(item => item.source === source)
			expect(entry, `missing headers entry for ${source}`).toBeDefined()
			expect(entry?.headers).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						key: 'X-Robots-Tag',
						value: 'noindex, nofollow',
					}),
				]),
			)
		}
	})
})
