import type {
	Category,
	CategoryTreeItem,
	Subcategory,
	Tag,
} from '@/types/catalog'
import {
	mockCategories,
	mockCategoryTrees,
	mockSubcategories,
	categorySlugToName,
} from '@/mocks/categories'
import { mockPopularTags, mockCollectionTags } from '@/mocks/tags'
import { getSeoContentFor } from '@/mocks/specs'

export async function getAllCategories(): Promise<Category[]> {
	return mockCategories
}

export async function getCategoryBySlug(
	slug: string,
): Promise<Category | undefined> {
	return mockCategories.find(c => c.slug === slug)
}

export async function getCategoryTree(
	slug: string,
): Promise<CategoryTreeItem[]> {
	return mockCategoryTrees[slug] ?? []
}

export async function getSubcategories(slug: string): Promise<Subcategory[]> {
	return mockSubcategories[slug] ?? []
}

export async function getPopularTags(slug: string): Promise<Tag[]> {
	return mockPopularTags[slug] ?? []
}

export async function getCollectionTags(): Promise<Tag[]> {
	return mockCollectionTags
}

export async function getSeoContent(slug: string): Promise<string> {
	return getSeoContentFor(slug)
}

export function getCategoryNameBySlug(slug: string): string | undefined {
	return categorySlugToName[slug]
}
