import { describe, expect, it } from 'vitest'

import robots from '@/app/robots'
import { buildRootMetadata } from '@/lib/seo/sitemetadata'

describe('phase I: robots and root metadata contracts', () => {
	it('robots содержит явные disallow правила для служебных маршрутов', () => {
		const result = robots()
		expect(result.host).toBe('https://aurasveta.by')
		expect(result.sitemap).toBe('https://aurasveta.by/sitemap.xml')

		const firstRule = Array.isArray(result.rules) ? result.rules[0] : result.rules
		expect(firstRule).toBeDefined()
		if (!firstRule || !('disallow' in firstRule)) {
			throw new Error('robots rule is missing disallow field')
		}

		const disallow = Array.isArray(firstRule.disallow)
			? firstRule.disallow
			: [firstRule.disallow]

		expect(disallow).toEqual(
			expect.arrayContaining([
				'/admin',
				'/api',
				'/cart',
				'/favorites',
				'/compare',
				'/search',
				'/login',
				'/register',
			]),
		)
	})

	it('root metadata включает author и theme-color', () => {
		const metadata = buildRootMetadata(null)
		expect(metadata.authors).toEqual([{ name: 'Аура Света' }])
		expect(metadata.other?.['theme-color']).toBe('#ffffff')
	})
})
