import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = 'c:/webcum/aurasveta'

function read(relPath: string) {
	return readFileSync(path.join(root, relPath), 'utf8')
}

describe('phase G: breadcrumb structured-data consistency', () => {
	it('основные template pages используют BreadcrumbStructuredData', () => {
		const catalogRoot = read('app/catalog/page.tsx')
		const catalogCategory = read('app/catalog/[slug]/page.tsx')
		const productPage = read('app/product/[slug]/page.tsx')

		expect(catalogRoot).toContain('<BreadcrumbStructuredData')
		expect(catalogCategory).toContain('<BreadcrumbStructuredData')
		expect(productPage).toContain('<BreadcrumbStructuredData')
	})

	it('category page строит иерархическую breadcrumb цепочку через parentId', () => {
		const categoryPage = read('app/catalog/[slug]/page.tsx')

		expect(categoryPage).toContain('buildCategoryBreadcrumbSchemaItems')
		expect(categoryPage).toContain('parentId = parent.parentId')
		expect(categoryPage).toContain("{ name: 'Каталог', href: '/catalog' }")
	})
})
