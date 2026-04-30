import { describe, expect, it } from 'vitest'
import {
	getAllSectionTypes,
	getSectionDefinition,
} from '@/entities/section'

describe('section registry', () => {
	it('returns all declared section types', () => {
		expect(getAllSectionTypes()).toEqual([
			'hero',
			'product-grid',
			'featured-categories',
			'rich-text',
			'gallery',
			'benefits',
			'faq',
			'cta-banner',
		])
	})

	it('returns a typed definition by section type', () => {
		const definition = getSectionDefinition('product-grid')
		expect(definition.type).toBe('product-grid')
		expect(definition.label).toBe('Сетка товаров')
	})
})
