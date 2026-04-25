import { z } from 'zod'
import type { Prisma, PrismaClient } from '@prisma/client'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'
import { generateSlug } from '@/shared/lib/generateSlug'
import { validateWebhookUrl } from '@/shared/lib/validateUrl'
import { deleteFile } from '@/lib/storage'
import type { StorageImageAsset } from '@/shared/types/storage'
import { withResolvedProductImages } from '@/lib/storage-image-assets'
import {
	isExternalOrLegacyImageKey,
	normalizeProductImagesForWrite,
	productImageInputSchema,
	productImageSelect,
	type ProductImageInput,
} from '@/lib/products/product-images'
import { getMainImage } from '@/shared/lib/product-utils'

const orderedProductImages = {
	orderBy: { order: 'asc' },
	select: productImageSelect,
} as const satisfies Prisma.Product$imagesArgs

const productCardSelect = {
	id: true,
	slug: true,
	name: true,
	description: true,
	price: true,
	compareAtPrice: true,
	stock: true,
	images: orderedProductImages,
	brand: true,
	brandCountry: true,
	rating: true,
	reviewsCount: true,
	badges: true,
	isActive: true,
	categoryId: true,
	createdAt: true,
	category: { select: { id: true, name: true, slug: true } },
} as const satisfies Prisma.ProductSelect

const productCatalogSelect = {
	...productCardSelect,
	sku: true,
	properties: { include: { property: true, propertyValue: true } },
} as const satisfies Prisma.ProductSelect

const productDetailInclude = {
	category: true,
	images: orderedProductImages,
	properties: { include: { property: true, propertyValue: true } },
} as const satisfies Prisma.ProductInclude

const propertyValueSchema = z.object({
	propertyId: z.string(),
	propertyValueId: z.string(),
})

const incomingProductImageSchema = z.union([
	z.string(),
	productImageInputSchema,
])
type IncomingProductImage = z.infer<typeof incomingProductImageSchema>

const productFilters = z.object({
	categorySlug: z.string().optional(),
	includeChildren: z.boolean().default(true),
	search: z.string().optional(),
	minPrice: z.number().optional(),
	maxPrice: z.number().optional(),
	brand: z.string().optional(),
	inStock: z.boolean().optional(),
	isNew: z.boolean().optional(),
	onSale: z.boolean().optional(),
	freeShipping: z.boolean().optional(),
	properties: z
		.record(z.string(), z.union([z.string(), z.array(z.string())]))
		.optional(),
	sortBy: z
		.enum(['price-asc', 'price-desc', 'name', 'newest', 'rating'])
		.optional(),
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(100).default(20),
})

const TRUE_VALUES = ['true', '1', 'yes', 'да']

function buildCategoryWhere(
	categoryId: string,
	includeChildren: boolean,
	children: Array<{ id: string }>,
): Prisma.ProductWhereInput {
	if (includeChildren && children.length > 0) {
		return {
			categoryId: {
				in: [categoryId, ...children.map(child => child.id)],
			},
		}
	}

	return { categoryId }
}

function toIncomingProductImages(
	images: readonly IncomingProductImage[] | undefined,
): ProductImageInput[] {
	return (images ?? []).map((image, index) => {
		if (typeof image === 'string') {
			const key = image.trim()
			return {
				key,
				url: key,
				originalName: null,
				size: null,
				mimeType: null,
				order: index,
				isMain: index === 0,
			}
		}

		return {
			...image,
			key: image.key.trim(),
			url: image.url.trim(),
			order: image.order,
		}
	})
}

function resolvePropertyValues(input: {
	properties?: Array<{ propertyId: string; value: string }>
	propertyValues?: Array<{ propertyId: string; value: string }>
}) {
	return input.properties ?? input.propertyValues ?? []
}

async function syncProductImages(
	tx: Prisma.TransactionClient,
	productId: string,
	images: readonly IncomingProductImage[],
) {
	const normalizedImages = normalizeProductImagesForWrite(
		toIncomingProductImages(images),
	)
	const existingImages = await tx.productImage.findMany({
		where: { productId },
		select: { key: true },
	})

	const nextKeys = new Set(normalizedImages.map(image => image.key))
	const keysToDelete = existingImages
		.map(image => image.key)
		.filter(key => !nextKeys.has(key) && !isExternalOrLegacyImageKey(key))

	await tx.productImage.deleteMany({ where: { productId } })

	if (normalizedImages.length > 0) {
		await tx.productImage.createMany({
			data: normalizedImages.map(image => ({
				productId,
				...image,
			})),
		})
	}

	return keysToDelete
}

async function deleteStorageKeys(keys: readonly string[]) {
	await Promise.allSettled(keys.map(key => deleteFile(key)))
}

type ProductImageReadShape = {
	key?: string | null
	url?: string | null
	isMain?: boolean | null
	order?: number | null
}

type ProductWithImagesReadShape = {
	images?: readonly ProductImageReadShape[] | null
}

async function enrichProduct<T extends ProductWithImagesReadShape>(
	product: T,
	cache?: Map<string, StorageImageAsset | null>,
) {
	return withResolvedProductImages(product, {
		cache,
	})
}

async function enrichProducts<T extends ProductWithImagesReadShape>(
	products: readonly T[],
) {
	const cache = new Map()
	return Promise.all(products.map(product => enrichProduct(product, cache)))
}

export const productsRouter = createTRPCRouter({
	getMany: baseProcedure.input(productFilters).query(async ({ ctx, input }) => {
		const {
			page,
			limit,
			categorySlug,
			includeChildren,
			search,
			minPrice,
			maxPrice,
			brand,
			inStock,
			isNew,
			onSale,
			freeShipping,
			properties,
			sortBy,
		} = input

		const where: Prisma.ProductWhereInput = { isActive: true }
		const andConditions: Prisma.ProductWhereInput[] = []

		if (categorySlug) {
			const category = await ctx.prisma.category.findUnique({
				where: { slug: categorySlug },
				select: { id: true, children: { select: { id: true } } },
			})

			if (category) {
				Object.assign(
					where,
					buildCategoryWhere(category.id, includeChildren, category.children),
				)
			}
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
				{ sku: { contains: search, mode: 'insensitive' } },
			]
		}

		if (minPrice !== undefined || maxPrice !== undefined) {
			where.price = {}
			if (minPrice !== undefined) where.price.gte = minPrice
			if (maxPrice !== undefined) where.price.lte = maxPrice
		}

		if (brand) where.brand = brand
		if (inStock !== undefined) where.stock = inStock ? { gt: 0 } : { equals: 0 }
		if (isNew) {
			andConditions.push({ badges: { array_contains: ['Новинка'] } })
		}
		if (onSale) {
			andConditions.push({ compareAtPrice: { not: null } })
		}
		if (freeShipping) {
			andConditions.push({
				properties: {
					some: {
						property: { slug: 'free_shipping' },
						propertyValue: { value: { in: TRUE_VALUES } },
					},
				},
			})
		}

		if (properties && Object.keys(properties).length > 0) {
			for (const [slug, rawValue] of Object.entries(properties)) {
				const slugValues = (
					Array.isArray(rawValue) ? rawValue : [rawValue]
				).filter(v => v?.trim())
				if (slugValues.length > 0) {
					andConditions.push({
						properties: {
							some: {
								property: { slug },
								propertyValue: { slug: { in: slugValues } },
							},
						},
					})
				}
			}
		}

		if (andConditions.length > 0) {
			where.AND = andConditions
		}

		let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
		switch (sortBy) {
			case 'price-asc':
				orderBy = { price: 'asc' }
				break
			case 'price-desc':
				orderBy = { price: 'desc' }
				break
			case 'name':
				orderBy = { name: 'asc' }
				break
			case 'newest':
				orderBy = { createdAt: 'desc' }
				break
			case 'rating':
				orderBy = { rating: 'desc' }
				break
		}

		const [items, total] = await Promise.all([
			ctx.prisma.product.findMany({
				where,
				orderBy,
				skip: (page - 1) * limit,
				take: limit,
				select: productCatalogSelect,
			}),
			ctx.prisma.product.count({ where }),
		])

		return {
			items: await enrichProducts(items),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		}
	}),

	getAvailableFilters: baseProcedure
		.input(
			z.object({
				categorySlug: z.string().optional(),
				includeChildren: z.boolean().default(true),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { categorySlug, includeChildren } = input
			const baseWhere: Prisma.ProductWhereInput = { isActive: true }

			if (categorySlug) {
				const category = await ctx.prisma.category.findUnique({
					where: { slug: categorySlug },
					select: { id: true, children: { select: { id: true } } },
				})

				if (!category) {
					return {
						staticFilters: [] as Array<{
							key: 'isNew' | 'onSale' | 'freeShipping'
							label: string
							count: number
						}>,
						propertyFilters: [] as Array<{
							key: string
							label: string
							type: string
							options: Array<{ value: string; label: string; count: number }>
						}>,
					}
				}

				Object.assign(
					baseWhere,
					buildCategoryWhere(category.id, includeChildren, category.children),
				)
			}

			const [newCount, saleCount, freeShippingCount, values] =
				await Promise.all([
					ctx.prisma.product.count({
						where: {
							...baseWhere,
							badges: { array_contains: ['Новинка'] },
						},
					}),
					ctx.prisma.product.count({
						where: {
							...baseWhere,
							compareAtPrice: { not: null },
						},
					}),
					ctx.prisma.product.count({
						where: {
							...baseWhere,
							properties: {
								some: {
									property: { key: 'free_shipping' },
									OR: TRUE_VALUES.map(value => ({ value })),
								},
							},
						},
					}),
					ctx.prisma.productPropertyValue.findMany({
						where: { product: baseWhere },
						select: {
							value: true,
							property: {
								select: {
									key: true,
									name: true,
									type: true,
								},
							},
						},
					}),
				])

			const staticFilters = [
				{ key: 'isNew' as const, label: 'Новинки', count: newCount },
				{
					key: 'onSale' as const,
					label: 'Товары со скидкой',
					count: saleCount,
				},
				{
					key: 'freeShipping' as const,
					label: 'Бесплатная доставка',
					count: freeShippingCount,
				},
			].filter(item => item.count > 0)

			const grouped = new Map<
				string,
				{
					key: string
					label: string
					options: Map<string, { label: string; count: number }>
				}
			>()

			for (const row of values) {
				if (!row.propertyValue) continue
				const valueSlug = row.propertyValue.slug
				const valueLabel = row.propertyValue.value

				const propertySlug = row.property.slug
				const existing = grouped.get(propertySlug)
				if (!existing) {
					grouped.set(propertySlug, {
						key: propertySlug,
						label: row.property.name,
						options: new Map([[valueSlug, { label: valueLabel, count: 1 }]]),
					})
					continue
				}

				const opt = existing.options.get(valueSlug)
				if (opt) {
					opt.count++
				} else {
					existing.options.set(valueSlug, { label: valueLabel, count: 1 })
				}
			}

			const propertyFilters = [...grouped.values()]
				.map(group => ({
					key: group.key,
					label: group.label,
					options: [...group.options.entries()]
						.map(([slug, { label, count }]) => ({
							value: slug,
							label,
							count,
						}))
						.sort(
							(a, b) => b.count - a.count || a.label.localeCompare(b.label),
						),
				}))
				.filter(group => group.options.length > 0)
				.sort((a, b) => a.label.localeCompare(b.label))

			return {
				staticFilters,
				propertyFilters,
			}
		}),

	getBySlug: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		const product = await ctx.prisma.product.findUnique({
			where: { slug: input },
			include: productDetailInclude,
		})

		return product ? enrichProduct(product) : null
	}),

	getById: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		const product = await ctx.prisma.product.findUnique({
			where: { id: input },
			include: productDetailInclude,
		})

		return product ? enrichProduct(product) : null
	}),

	getBrands: baseProcedure.query(async ({ ctx }) => {
		const products = await ctx.prisma.product.findMany({
			where: { isActive: true, brand: { not: null } },
			select: { brand: true },
			distinct: ['brand'],
		})

		return products.map(product => product.brand).filter(Boolean) as string[]
	}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				slug: z.string().optional(),
				description: z.string().nullable().optional(),
				price: z.number().positive().optional(),
				compareAtPrice: z.number().positive().nullable().optional(),
				stock: z.number().int().min(0).default(0),
				sku: z.string().nullable().optional(),
				images: z.array(incomingProductImageSchema).optional(),
				categoryId: z.string().nullable().optional(),
				isActive: z.boolean().default(true),
				brand: z.string().nullable().optional(),
				brandCountry: z.string().nullable().optional(),
				badges: z.array(z.string()).default([]),
				metaTitle: z.string().nullable().optional(),
				metaDesc: z.string().nullable().optional(),
				properties: z.array(propertyValueSchema).optional(),
				propertyValues: z.array(propertyValueSchema).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { properties, propertyValues, images, ...productData } = input
			const resolvedProperties = resolvePropertyValues({
				properties,
				propertyValues,
			})
			const normalizedImages = normalizeProductImagesForWrite(
				toIncomingProductImages(images),
			)

			let slug = productData.slug?.trim() || generateSlug(productData.name)
			let suffix = 0
			while (await ctx.prisma.product.findUnique({ where: { slug } })) {
				suffix++
				slug = `${generateSlug(productData.name)}-${suffix}`
			}

			const product = await ctx.prisma.product.create({
				data: {
					...productData,
					slug,
					userId: ctx.userId,
					images:
						normalizedImages.length > 0
							? { create: normalizedImages }
							: undefined,
					properties:
						resolvedProperties.length > 0
							? {
									create: resolvedProperties.map(property => ({
										propertyId: property.propertyId,
										propertyValueId: property.propertyValueId,
									})),
								}
							: undefined,
				},
				include: productDetailInclude,
			})

			void fireWebhooks(ctx.prisma, 'product.created', product)
			return product
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				slug: z.string().optional(),
				description: z.string().nullable().optional(),
				price: z.number().positive().optional(),
				compareAtPrice: z.number().positive().nullable().optional(),
				stock: z.number().int().min(0).optional(),
				sku: z.string().nullable().optional(),
				images: z.array(incomingProductImageSchema).optional(),
				categoryId: z.string().nullable().optional(),
				isActive: z.boolean().optional(),
				brand: z.string().nullable().optional(),
				brandCountry: z.string().nullable().optional(),
				badges: z.array(z.string()).optional(),
				metaTitle: z.string().nullable().optional(),
				metaDesc: z.string().nullable().optional(),
				properties: z.array(propertyValueSchema).optional(),
				propertyValues: z.array(propertyValueSchema).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, properties, propertyValues, images, ...data } = input
			const resolvedProperties =
				properties === undefined && propertyValues === undefined
					? undefined
					: resolvePropertyValues({ properties, propertyValues })

			if (data.name && !data.slug) {
				let slug = generateSlug(data.name)
				let suffix = 0
				while (
					await ctx.prisma.product.findFirst({
						where: { slug, id: { not: id } },
					})
				) {
					suffix++
					slug = `${generateSlug(data.name)}-${suffix}`
				}
				data.slug = slug
			}

			const { product, keysToDelete } = await ctx.prisma.$transaction(
				async tx => {
					if (resolvedProperties) {
						await tx.productPropertyValue.deleteMany({
							where: { productId: id },
						})

						if (resolvedProperties.length > 0) {
							await tx.productPropertyValue.createMany({
								data: resolvedProperties.map(property => ({
									productId: id,
									propertyId: property.propertyId,
								propertyValueId: property.propertyValueId,
								})),
							})
						}
					}

					await tx.product.update({
						where: { id },
						data,
					})

					const removableKeys =
						images !== undefined ? await syncProductImages(tx, id, images) : []

					const updatedProduct = await tx.product.findUniqueOrThrow({
						where: { id },
						include: productDetailInclude,
					})

					return { product: updatedProduct, keysToDelete: removableKeys }
				},
			)

			await deleteStorageKeys(keysToDelete)
			void fireWebhooks(ctx.prisma, 'product.updated', product)
			return product
		}),

	updateProductImages: adminProcedure
		.input(
			z.object({
				productId: z.string(),
				images: z.array(productImageInputSchema),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { product, keysToDelete } = await ctx.prisma.$transaction(
				async tx => {
					await tx.product.findUniqueOrThrow({
						where: { id: input.productId },
						select: { id: true },
					})

					const removableKeys = await syncProductImages(
						tx,
						input.productId,
						input.images,
					)

					const product = await tx.product.findUniqueOrThrow({
						where: { id: input.productId },
						include: productDetailInclude,
					})

					return { product, keysToDelete: removableKeys }
				},
			)

			await deleteStorageKeys(keysToDelete)
			void fireWebhooks(ctx.prisma, 'product.updated', product)
			return product
		}),

	getNew: baseProcedure
		.input(z.number().min(1).max(50).default(8))
		.query(async ({ ctx, input: limit }) => {
			const products = await ctx.prisma.product.findMany({
				where: {
					isActive: true,
					badges: { array_contains: ['Новинка'] },
				},
				orderBy: { createdAt: 'desc' },
				take: limit,
				select: productCardSelect,
			})

			return enrichProducts(products)
		}),

	getSale: baseProcedure
		.input(z.number().min(1).max(50).default(8))
		.query(async ({ ctx, input: limit }) => {
			const products = await ctx.prisma.product.findMany({
				where: {
					isActive: true,
					compareAtPrice: { not: null },
				},
				orderBy: { createdAt: 'desc' },
				take: limit,
				select: productCardSelect,
			})

			return enrichProducts(products)
		}),

	getByIds: baseProcedure
		.input(z.array(z.string()).max(50))
		.query(async ({ ctx, input: ids }) => {
			if (ids.length === 0) return []

			const products = await ctx.prisma.product.findMany({
				where: { id: { in: ids }, isActive: true },
				select: productCatalogSelect,
			})

			return enrichProducts(products)
		}),

	getSpecs: baseProcedure
		.input(z.string())
		.query(async ({ ctx, input: productId }) => {
			const values = await ctx.prisma.productPropertyValue.findMany({
				where: { productId },
				include: { property: true },
				orderBy: { property: { name: 'asc' } },
			})

			return values.map(value => ({
				key: value.property.key,
				label: value.property.name,
				value: value.value,
				type: value.property.type,
			}))
		}),

	getImage: baseProcedure
		.input(z.string())
		.query(async ({ ctx, input: productId }) => {
			const product = await ctx.prisma.product.findUnique({
				where: { id: productId },
				select: { images: orderedProductImages },
			})

			const enriched = product ? await enrichProduct(product) : null
			return enriched?.imageUrl ?? null
		}),

	updateImagePath: adminProcedure
		.input(
			z.object({
				productId: z.string(),
				imagePath: z.string().nullable(),
				imageOriginalName: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const singleImage = input.imagePath
				? [
						{
							key: input.imagePath,
							url: input.imagePath,
							originalName: input.imageOriginalName ?? null,
							size: null,
							mimeType: null,
							order: 0,
							isMain: true,
						},
					]
				: []

			const { product, keysToDelete } = await ctx.prisma.$transaction(
				async tx => {
					await tx.product.findUniqueOrThrow({
						where: { id: input.productId },
						select: { id: true },
					})

					const removableKeys = await syncProductImages(
						tx,
						input.productId,
						singleImage,
					)

					const product = await tx.product.findUniqueOrThrow({
						where: { id: input.productId },
						select: {
							id: true,
							images: orderedProductImages,
						},
					})

					return { product, keysToDelete: removableKeys }
				},
			)

			await deleteStorageKeys(keysToDelete)
			const image = getMainImage(product)

			return {
				id: product.id,
				image,
				imagePath: image?.url ?? null,
			}
		}),

	removeImage: adminProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const { product, keysToDelete } = await ctx.prisma.$transaction(
				async tx => {
					const removableKeys = await syncProductImages(tx, input, [])

					const product = await tx.product.findUniqueOrThrow({
						where: { id: input },
						select: { id: true },
					})

					return { product, keysToDelete: removableKeys }
				},
			)

			await deleteStorageKeys(keysToDelete)
			return product
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		const product = await ctx.prisma.product.findUnique({
			where: { id: input },
			select: { images: { select: { key: true } } },
		})

		const keysToDelete = (product?.images ?? [])
			.map(image => image.key)
			.filter(key => !isExternalOrLegacyImageKey(key))

		const deletedProduct = await ctx.prisma.product.delete({
			where: { id: input },
		})
		await deleteStorageKeys(keysToDelete)
		return deletedProduct
	}),

	getDynamicGrid: baseProcedure
		.input(
			z.object({
				source: z.enum(['promotion', 'novelty', 'popular', 'property']),
				propertyValueId: z.string().optional(),
				limit: z.number().int().min(1).max(50).default(8),
				sortBy: z
					.enum(['newest', 'price_asc', 'price_desc', 'popular'])
					.default('newest'),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { source, propertyValueId, limit, sortBy } = input

			const where: Prisma.ProductWhereInput = { isActive: true }

			switch (source) {
				case 'promotion':
					where.compareAtPrice = { not: null }
					break
				case 'novelty':
					// newest sorted below
					break
				case 'property':
					if (propertyValueId) {
						where.properties = { some: { propertyValueId } }
					}
					break
				case 'popular':
					// sorted by reviewsCount below
					break
			}

			let orderBy: Prisma.ProductOrderByWithRelationInput
			switch (sortBy) {
				case 'price_asc':
					orderBy = { price: 'asc' }
					break
				case 'price_desc':
					orderBy = { price: 'desc' }
					break
				case 'popular':
					orderBy = { reviewsCount: 'desc' }
					break
				case 'newest':
				default:
					orderBy = { createdAt: 'desc' }
					break
			}

			if (source === 'popular') {
				orderBy = { reviewsCount: 'desc' }
			}

			const products = await ctx.prisma.product.findMany({
				where,
				orderBy,
				take: limit,
				select: productCardSelect,
			})

			return enrichProducts(products)
		}),
})

async function fireWebhooks(db: PrismaClient, event: string, data: unknown) {
	try {
		const webhooks = await db.webhook.findMany({
			where: { events: { has: event } },
		})

		await Promise.allSettled(
			webhooks
				.filter(webhook => validateWebhookUrl(webhook.url).valid)
				.map(webhook =>
					fetch(webhook.url, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							event,
							data,
							timestamp: new Date().toISOString(),
						}),
					}),
				),
		)
	} catch {
		// Silently fail webhook delivery
	}
}
