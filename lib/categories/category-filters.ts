import type { CategoryFilterKind, CategoryMode, Prisma } from '@prisma/client'

export type CategoryFilterAware = {
	id: string
	categoryMode?: CategoryMode | null
	filterKind?: CategoryFilterKind | null
	filterPropertyId?: string | null
	filterPropertyValueId?: string | null
}

type CategoryFilterAwareWithChildren = CategoryFilterAware & {
	children?: Array<{ id: string }> | null
}

export function isFilteringCategory(category: CategoryFilterAware): boolean {
	return category.categoryMode === 'FILTER'
}

function buildImpossibleProductWhere(): Prisma.ProductWhereInput {
	return { id: '__missing_category_filter__' }
}

export function buildCategoryProductWhere(
	category: CategoryFilterAwareWithChildren,
	options?: {
		includeChildren?: boolean
	},
): Prisma.ProductWhereInput {
	if (!isFilteringCategory(category)) {
		const childIds = options?.includeChildren
			? (category.children ?? []).map(child => child.id)
			: []

		if (childIds.length > 0) {
			return {
				categoryId: {
					in: [category.id, ...childIds],
				},
			}
		}

		return { categoryId: category.id }
	}

	switch (category.filterKind) {
		case 'SALE':
			return { compareAtPrice: { not: null } }
		case 'PROPERTY_VALUE':
			if (!category.filterPropertyValueId) {
				return buildImpossibleProductWhere()
			}

			return {
				properties: {
					some: {
						propertyValueId: category.filterPropertyValueId,
						...(category.filterPropertyId
							? { propertyId: category.filterPropertyId }
							: {}),
					},
				},
			}
		default:
			return buildImpossibleProductWhere()
	}
}

export function getCategoryFilterSummary(
	category: CategoryFilterAware & {
		filterProperty?: { name: string } | null
		filterPropertyValue?: { value: string } | null
	},
): string | null {
	if (!isFilteringCategory(category)) return null

	if (category.filterKind === 'SALE') {
		return 'Товары со скидкой'
	}

	if (
		category.filterKind === 'PROPERTY_VALUE' &&
		category.filterProperty?.name &&
		category.filterPropertyValue?.value
	) {
		return `${category.filterProperty.name}: ${category.filterPropertyValue.value}`
	}

	return 'Фильтрующая категория'
}
