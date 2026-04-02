import type { Product } from '@/types/product'
import type { SpecItem, SpecGroup, CompareSpecSection } from '@/types/specs'
import { mockProducts } from '@/mocks/products'
import {
	getQuickSpecsFor,
	getSpecGroupsFor,
	getCompareSpecsFor,
} from '@/mocks/specs'

/**
 * Returns all products.
 * In development mode returns mock data;
 * replace the body with a real API call for production.
 */
export async function getAllProducts(): Promise<Product[]> {
	if (process.env.NODE_ENV === 'development') {
		return mockProducts
	}
	// TODO: replace with real API call
	return mockProducts
}

/**
 * Returns a single product by id.
 */
export async function getProductById(
	id: string | number,
): Promise<Product | undefined> {
	const products = await getAllProducts()
	return products.find(p => String(p.id) === String(id))
}

/**
 * Returns a single product by slug.
 */
export async function getProductBySlug(
	slug: string,
): Promise<Product | undefined> {
	const products = await getAllProducts()
	return products.find(p => p.slug === slug)
}

/**
 * Returns products filtered by category name.
 */
export async function getProductsByCategory(
	category: string,
): Promise<Product[]> {
	const products = await getAllProducts()
	return products.filter(p => p.category === category)
}

/**
 * Returns all unique category names.
 */
export async function getCategories(): Promise<string[]> {
	const products = await getAllProducts()
	return [...new Set(products.map(p => p.category))]
}

/**
 * Returns quick specs for a product.
 */
export async function getQuickSpecs(productId: number): Promise<SpecItem[]> {
	return getQuickSpecsFor(productId)
}

/**
 * Returns full spec groups for a product.
 */
export async function getProductSpecGroups(
	productId: number,
): Promise<SpecGroup[]> {
	return getSpecGroupsFor(productId)
}

/**
 * Returns comparison spec sections for a category.
 */
export async function getCompareSpecs(
	categorySlug: string,
): Promise<CompareSpecSection[]> {
	return getCompareSpecsFor(categorySlug)
}
