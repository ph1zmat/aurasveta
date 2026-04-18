import { z } from 'zod'
import { unlink } from 'fs/promises'
import path from 'path'
import type { Prisma, PrismaClient } from '@prisma/client'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'
import { generateSlug } from '@/shared/lib/generateSlug'
import { validateWebhookUrl } from '@/shared/lib/validateUrl'

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
				in: [categoryId, ...children.map(c => c.id)],
			},
		}
	}

	return { categoryId }
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
						property: { key: 'free_shipping' },
						OR: TRUE_VALUES.map(value => ({ value })),
					},
				},
			})
		}

		if (properties && Object.keys(properties).length > 0) {
			const propertyOr = Object.entries(properties).flatMap(([key, rawValue]) => {
				const values = Array.isArray(rawValue) ? rawValue : [rawValue]
				return values
					.filter(value => value && value.trim().length > 0)
					.map(value => ({
						property: { key },
						value,
					}))
			})

			if (propertyOr.length > 0) {
				andConditions.push({
					properties: {
						some: {
							OR: propertyOr,
						},
					},
				})
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
				select: {
					id: true,
					slug: true,
					name: true,
					description: true,
					price: true,
					compareAtPrice: true,
					stock: true,
					sku: true,
					images: true,
					imagePath: true,
					brand: true,
					brandCountry: true,
					rating: true,
					reviewsCount: true,
					badges: true,
					isActive: true,
					categoryId: true,
					createdAt: true,
					category: { select: { name: true, slug: true } },
					properties: { include: { property: true } },
				},
			}),
			ctx.prisma.product.count({ where }),
		])

		return {
			items,
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

			const [newCount, saleCount, freeShippingCount, values] = await Promise.all([
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
					where: {
						product: baseWhere,
					},
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
				{ key: 'onSale' as const, label: 'Товары со скидкой', count: saleCount },
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
					type: string
					options: Map<string, number>
				}
			>()

			for (const row of values) {
				const normalizedValue = row.value?.trim()
				if (!normalizedValue) continue

				const propertyKey = row.property.key
				const existing = grouped.get(propertyKey)
				if (!existing) {
					grouped.set(propertyKey, {
						key: propertyKey,
						label: row.property.name,
						type: row.property.type,
						options: new Map([[normalizedValue, 1]]),
					})
					continue
				}

				existing.options.set(
					normalizedValue,
					(existing.options.get(normalizedValue) ?? 0) + 1,
				)
			}

			const propertyFilters = [...grouped.values()]
				.map(group => ({
					key: group.key,
					label: group.label,
					type: group.type,
					options: [...group.options.entries()]
						.map(([value, count]) => ({
							value,
							label: value,
							count,
						}))
						.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
				}))
				.filter(group => group.options.length > 0)
				.sort((a, b) => a.label.localeCompare(b.label))

			return {
				staticFilters,
				propertyFilters,
			}
		}),

	getBySlug: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.product.findUnique({
			where: { slug: input },
			include: {
				category: true,
				properties: { include: { property: true } },
			},
		})
	}),

	getById: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.product.findUnique({
			where: { id: input },
			include: {
				category: true,
				properties: { include: { property: true } },
			},
		})
	}),

	getBrands: baseProcedure.query(async ({ ctx }) => {
		const products = await ctx.prisma.product.findMany({
			where: { isActive: true, brand: { not: null } },
			select: { brand: true },
			distinct: ['brand'],
		})
		return products.map(p => p.brand).filter(Boolean) as string[]
	}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				slug: z.string().optional(),
				description: z.string().optional(),
				price: z.number().positive().optional(),
				compareAtPrice: z.number().positive().optional(),
				stock: z.number().int().min(0).default(0),
				sku: z.string().optional(),
				images: z.array(z.string()).default([]),
				categoryId: z.string().optional(),
				isActive: z.boolean().default(true),
				brand: z.string().optional(),
				brandCountry: z.string().optional(),
				badges: z.array(z.string()).default([]),
				metaTitle: z.string().optional(),
				metaDesc: z.string().optional(),
				properties: z
					.array(
						z.object({
							propertyId: z.string(),
							value: z.string(),
						}),
					)
					.default([]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { properties, ...productData } = input

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
					properties: {
						create: properties.map(p => ({
							propertyId: p.propertyId,
							value: p.value,
						})),
					},
				},
				include: {
					category: true,
					properties: { include: { property: true } },
				},
			})

			// Fire webhooks
			void fireWebhooks(ctx.prisma, 'product.created', product)

			return product
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				slug: z.string().optional(),
				description: z.string().optional(),
				price: z.number().positive().optional(),
				compareAtPrice: z.number().positive().nullable().optional(),
				stock: z.number().int().min(0).optional(),
				sku: z.string().nullable().optional(),
				images: z.array(z.string()).optional(),
				categoryId: z.string().nullable().optional(),
				isActive: z.boolean().optional(),
				brand: z.string().nullable().optional(),
				brandCountry: z.string().nullable().optional(),
				badges: z.array(z.string()).optional(),
				metaTitle: z.string().nullable().optional(),
				metaDesc: z.string().nullable().optional(),
				properties: z
					.array(
						z.object({
							propertyId: z.string(),
							value: z.string(),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, properties, ...data } = input

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

			if (properties) {
				await ctx.prisma.productPropertyValue.deleteMany({
					where: { productId: id },
				})
				if (properties.length > 0) {
					await ctx.prisma.productPropertyValue.createMany({
						data: properties.map(p => ({
							productId: id,
							propertyId: p.propertyId,
							value: p.value,
						})),
					})
				}
			}

			const product = await ctx.prisma.product.update({
				where: { id },
				data,
				include: {
					category: true,
					properties: { include: { property: true } },
				},
			})

			void fireWebhooks(ctx.prisma, 'product.updated', product)

			return product
		}),

	getNew: baseProcedure
		.input(z.number().min(1).max(50).default(8))
		.query(async ({ ctx, input: limit }) => {
			return ctx.prisma.product.findMany({
				where: {
					isActive: true,
					badges: { array_contains: ['Новинка'] },
				},
				orderBy: { createdAt: 'desc' },
				take: limit,
				select: {
					id: true,
					slug: true,
					name: true,
					description: true,
					price: true,
					compareAtPrice: true,
					stock: true,
					images: true,
					imagePath: true,
					brand: true,
					brandCountry: true,
					rating: true,
					reviewsCount: true,
					badges: true,
					createdAt: true,
					category: { select: { name: true, slug: true } },
				},
			})
		}),

	getSale: baseProcedure
		.input(z.number().min(1).max(50).default(8))
		.query(async ({ ctx, input: limit }) => {
			return ctx.prisma.product.findMany({
				where: {
					isActive: true,
					compareAtPrice: { not: null },
				},
				orderBy: { createdAt: 'desc' },
				take: limit,
				select: {
					id: true,
					slug: true,
					name: true,
					description: true,
					price: true,
					compareAtPrice: true,
					stock: true,
					images: true,
					imagePath: true,
					brand: true,
					brandCountry: true,
					rating: true,
					reviewsCount: true,
					badges: true,
					createdAt: true,
					category: { select: { name: true, slug: true } },
				},
			})
		}),

	getByIds: baseProcedure
		.input(z.array(z.string()).max(50))
		.query(async ({ ctx, input: ids }) => {
			if (ids.length === 0) return []
			return ctx.prisma.product.findMany({
				where: { id: { in: ids }, isActive: true },
				select: {
					id: true,
					slug: true,
					name: true,
					description: true,
					price: true,
					compareAtPrice: true,
					stock: true,
					images: true,
					imagePath: true,
					brand: true,
					brandCountry: true,
					rating: true,
					reviewsCount: true,
					badges: true,
					createdAt: true,
					category: { select: { id: true, name: true, slug: true } },
					properties: { include: { property: true } },
				},
			})
		}),

	getSpecs: baseProcedure
		.input(z.string())
		.query(async ({ ctx, input: productId }) => {
			const values = await ctx.prisma.productPropertyValue.findMany({
				where: { productId },
				include: { property: true },
				orderBy: { property: { name: 'asc' } },
			})
			return values.map(v => ({
				key: v.property.key,
				label: v.property.name,
				value: v.value,
				type: v.property.type,
			}))
		}),

	getImage: baseProcedure
		.input(z.string())
		.query(async ({ ctx, input: productId }) => {
			const product = await ctx.prisma.product.findUnique({
				where: { id: productId },
				select: { imagePath: true },
			})
			return product?.imagePath ?? null
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
			return ctx.prisma.product.update({
				where: { id: input.productId },
				data: {
					imagePath: input.imagePath,
					imageOriginalName: input.imageOriginalName ?? null,
				},
				select: { id: true, imagePath: true },
			})
		}),

	removeImage: adminProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const product = await ctx.prisma.product.findUnique({
				where: { id: input },
				select: { imagePath: true },
			})

			if (product?.imagePath) {
				const fileName = path.basename(product.imagePath)
				const fullPath = path.join(
					process.cwd(),
					'public',
					'productimg',
					fileName,
				)
				try {
					await unlink(fullPath)
				} catch {
					/* file may not exist */
				}
			}

			return ctx.prisma.product.update({
				where: { id: input },
				data: { imagePath: null, imageOriginalName: null },
				select: { id: true },
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.product.delete({ where: { id: input } })
	}),
})

async function fireWebhooks(db: PrismaClient, event: string, data: unknown) {
	try {
		const webhooks = await db.webhook.findMany({
			where: { events: { has: event } },
		})
		await Promise.allSettled(
			webhooks
				.filter(wh => validateWebhookUrl(wh.url).valid)
				.map(wh =>
					fetch(wh.url, {
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
