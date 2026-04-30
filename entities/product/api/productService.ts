import type { Product } from '@/entities/product/model/types'
import type {
	SpecItem,
	SpecGroup,
	CompareSpecSection,
} from '@/entities/spec/model/types'
import { toFrontendProduct } from '@/entities/product/model/adapters'
import { productImageSelect } from '@/lib/products/product-images'
import { prisma } from '@/lib/prisma'
import { withResolvedProductImages } from '@/lib/storage-image-assets'

const productInclude = {
	category: { select: { name: true, slug: true } },
	rootCategory: { select: { name: true, slug: true } },
	subcategory: { select: { name: true, slug: true } },
	metaTitle: true,
	metaDesc: true,
	images: {
		orderBy: { order: 'asc' },
		select: productImageSelect,
	},
} as const

/** Select only fields needed for product cards (listings). */
const productCardSelect = {
	id: true,
	slug: true,
	name: true,
	description: true,
	metaTitle: true,
	metaDesc: true,
	price: true,
	compareAtPrice: true,
	stock: true,
	images: {
		orderBy: { order: 'asc' },
		select: productImageSelect,
	},
	brand: true,
	brandCountry: true,
	rating: true,
	reviewsCount: true,
	badges: true,
	createdAt: true,
	categoryId: true,
	rootCategoryId: true,
	subcategoryId: true,
	category: { select: { name: true, slug: true } },
	rootCategory: { select: { name: true, slug: true } },
	subcategory: { select: { name: true, slug: true } },
} as const
/**
 * Returns all products.
 */
export async function getAllProducts(): Promise<Product[]> {
	const dbProducts = await prisma.product.findMany({
		where: { isActive: true },
		select: productCardSelect,
		orderBy: { createdAt: 'desc' },
	})
	const cache = new Map()
	const enrichedProducts = await Promise.all(
		dbProducts.map((product: (typeof dbProducts)[number]) =>
			withResolvedProductImages(product, { cache }),
		),
	)
	return enrichedProducts.map(toFrontendProduct)
}

/**
 * Returns a single product by id.
 */
export async function getProductById(
	id: string | number,
): Promise<Product | undefined> {
	const dbProduct = await prisma.product.findUnique({
		where: { id: String(id) },
		include: productInclude,
	})
	if (!dbProduct) return undefined

	return toFrontendProduct(await withResolvedProductImages(dbProduct))
}

/**
 * Returns a single product by slug.
 */
export async function getProductBySlug(
	slug: string,
): Promise<Product | undefined> {
	const dbProduct = await prisma.product.findUnique({
		where: { slug },
		include: productInclude,
	})
	if (!dbProduct) return undefined

	return toFrontendProduct(await withResolvedProductImages(dbProduct))
}

/**
 * Returns products filtered by category name.
 */
export async function getProductsByCategory(
	category: string,
): Promise<Product[]> {
	const dbProducts = await prisma.product.findMany({
		where: {
			isActive: true,
			OR: [
				{ subcategory: { name: category } },
				{ rootCategory: { name: category } },
				{ category: { name: category } },
			],
		},
		select: productCardSelect,
		orderBy: { createdAt: 'desc' },
	})
	const cache = new Map()
	const enrichedProducts = await Promise.all(
		dbProducts.map((product: (typeof dbProducts)[number]) =>
			withResolvedProductImages(product, { cache }),
		),
	)
	return enrichedProducts.map(toFrontendProduct)
}

/**
 * Returns all unique category names.
 */
export async function getCategories(): Promise<string[]> {
	const cats = await prisma.category.findMany({
		select: { name: true },
		orderBy: { name: 'asc' },
	})
	return cats.map((category: (typeof cats)[number]) => category.name)
}

/**
 * Returns quick specs for a product (top property values).
 */
export async function getQuickSpecs(
	productId: number | string,
): Promise<SpecItem[]> {
	const values = await prisma.productPropertyValue.findMany({
		where: { productId: String(productId) },
		include: { property: true, propertyValue: true },
		orderBy: { property: { name: 'asc' } },
		take: 4,
	})
	return values.map((value: (typeof values)[number]) => ({
		label: value.property.name,
		value: value.propertyValue.value,
		tooltip: true,
	}))
}

/**
 * Returns full spec groups for a product.
 */
export async function getProductSpecGroups(
	productId: number | string,
): Promise<SpecGroup[]> {
	const values = await prisma.productPropertyValue.findMany({
		where: { productId: String(productId) },
		include: { property: true, propertyValue: true },
		orderBy: { property: { name: 'asc' } },
	})
	if (values.length === 0) return []
	return [
		{
			title: 'Характеристики',
			rows: values.map((value: (typeof values)[number]) => ({
				label: value.property.name,
				value: value.propertyValue.value,
			})),
		},
	]
}

/**
 * Returns comparison spec sections for a set of products.
 */
export async function getCompareSpecs(
	productIds: string[],
): Promise<CompareSpecSection[]> {
	if (productIds.length === 0) return []

	const values = await prisma.productPropertyValue.findMany({
		where: { productId: { in: productIds } },
		include: { property: true, propertyValue: true },
		orderBy: { property: { name: 'asc' } },
	})

	// Group by property slug
	const propMap = new Map<
		string,
		{ label: string; values: Map<string, string> }
	>()
	for (const v of values) {
		if (!propMap.has(v.property.slug)) {
			propMap.set(v.property.slug, { label: v.property.name, values: new Map() })
		}
		propMap.get(v.property.slug)!.values.set(v.productId, v.propertyValue.value)
	}

	const rows = Array.from(propMap.values()).map(prop => ({
		label: prop.label,
		values: productIds.map(id => prop.values.get(id) ?? null),
	}))

	if (rows.length === 0) return []
	return [{ title: 'Характеристики', rows }]
}
