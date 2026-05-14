import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/lib/middleware/proxy'
import { seoToMetadata } from '@/lib/seo/getmetadata'
import nextConfig from '@/next.config'

describe('SEO smoke tests', () => {
	describe('WWW → non-www redirect', () => {
		it('returns 301 for www.aurasveta.by', () => {
			const request = new NextRequest('https://www.aurasveta.by/catalog/bra', {
				headers: { host: 'www.aurasveta.by' },
			})
			const response = proxy(request)
			expect(response.status).toBe(301)
			expect(response.headers.get('location')).toBe('https://aurasveta.by/catalog/bra')
		})

		it('does not redirect for canonical host', () => {
			const request = new NextRequest('https://aurasveta.by/catalog/bra', {
				headers: { host: 'aurasveta.by' },
			})
			const response = proxy(request)
			expect(response.status).toBe(200)
		})
	})

	describe('security headers', () => {
		it('adds security headers to all responses', () => {
			const request = new NextRequest('https://aurasveta.by/catalog/bra', {
				headers: { host: 'aurasveta.by' },
			})
			const response = proxy(request)
			expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
			expect(response.headers.get('X-Frame-Options')).toBe('DENY')
			expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
		})
	})

	describe('hreflang', () => {
		it('seoToMetadata includes ru-by and x-default languages', () => {
			const metadata = seoToMetadata({
				title: 'Test',
				description: 'Test desc',
				ogTitle: null,
				ogDescription: null,
				ogImage: null,
				canonicalUrl: 'https://aurasveta.by/test',
				noIndex: false,
				keywords: null,
			})
			expect(metadata.alternates).toMatchObject({
				canonical: 'https://aurasveta.by/test',
				languages: {
					'ru-by': 'https://aurasveta.by',
					'x-default': 'https://aurasveta.by',
				},
			})
		})
	})

	describe('Cache-Control headers in next.config.ts', () => {
		it('has ISR cache headers for product pages', async () => {
			const headers = await nextConfig.headers!()
			const productHeader = headers.find(h => h.source === '/product/:slug*')
			expect(productHeader).toBeDefined()
			const cacheControl = productHeader!.headers.find(
				h => h.key === 'Cache-Control',
			)
			expect(cacheControl!.value).toContain('s-maxage')
			expect(cacheControl!.value).toContain('stale-while-revalidate')
		})

		it('has long-term cache for static assets', async () => {
			const headers = await nextConfig.headers!()
			const staticHeader = headers.find(h => h.source === '/_next/static/:path*')
			expect(staticHeader).toBeDefined()
			const cacheControl = staticHeader!.headers.find(
				h => h.key === 'Cache-Control',
			)
			expect(cacheControl!.value).toContain('max-age=31536000')
			expect(cacheControl!.value).toContain('immutable')
		})
	})

	describe('trailing slash redirect', () => {
		it('has 301 redirect for trailing slash', async () => {
			const redirects = await nextConfig.redirects!()
			const trailingSlash = redirects.find(r => r.source === '/:path+/')
			expect(trailingSlash).toBeDefined()
			expect(trailingSlash!.permanent).toBe(true)
			expect(trailingSlash!.destination).toBe('/:path+')
		})
	})

	describe('robots headers for private pages', () => {
		it('has X-Robots-Tag for /admin', async () => {
			const headers = await nextConfig.headers!()
			const adminHeader = headers.find(h => h.source === '/admin/:path*')
			expect(adminHeader).toBeDefined()
			const robots = adminHeader!.headers.find(h => h.key === 'X-Robots-Tag')
			expect(robots!.value).toBe('noindex, nofollow')
		})
	})
})
