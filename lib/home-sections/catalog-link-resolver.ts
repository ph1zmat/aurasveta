import type { PrismaClient } from '@prisma/client'

interface CatalogLinkConfig {
	href?: string | null
	linkCategoryId?: string | null
	linkPropertyId?: string | null
	linkPropertyValueId?: string | null
	categoryId?: string | null
	propertyId?: string | null
	_propertyId?: string | null
	propertyValueId?: string | null
}

function normalizeHref(href?: string | null) {
	const trimmed = href?.trim()
	return trimmed ? trimmed : undefined
}

export async function resolveCatalogLinkHref(
	prisma: PrismaClient,
	config: CatalogLinkConfig | null | undefined,
) {
	const explicitHref = normalizeHref(config?.href)
	if (explicitHref) return explicitHref

	const categoryId = config?.linkCategoryId ?? config?.categoryId ?? undefined
	if (categoryId) {
		const category = await prisma.category.findUnique({
			where: { id: categoryId },
			select: { slug: true },
		})
		if (category?.slug) {
			return `/catalog/${category.slug}`
		}
	}

	const propertyId =
		config?.linkPropertyId ??
		config?.propertyId ??
		config?._propertyId ??
		undefined
	const propertyValueId =
		config?.linkPropertyValueId ?? config?.propertyValueId ?? undefined

	if (propertyId && propertyValueId) {
		const propertyValue = await prisma.propertyValue.findUnique({
			where: { id: propertyValueId },
			select: {
				slug: true,
				propertyId: true,
				property: { select: { slug: true } },
			},
		})

		if (propertyValue && propertyValue.propertyId === propertyId) {
			return `/catalog?prop.${propertyValue.property.slug}=${propertyValue.slug}`
		}
	}

	return undefined
}
