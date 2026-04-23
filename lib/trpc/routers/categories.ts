import { z } from 'zod'
import { createTRPCRouter, baseProcedure, adminProcedure } from '../init'
import { generateSlug } from '@/shared/lib/generateSlug'
import { deleteFile } from '@/lib/storage'
import { productImageSelect } from '@/lib/products/product-images'

export const categoriesRouter = createTRPCRouter({
	getAll: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.category.findMany({
			include: { children: true, _count: { select: { products: true } } },
			orderBy: { name: 'asc' },
		})
	}),

	getTree: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.category.findMany({
			where: { parentId: null },
			include: {
				children: {
					include: {
						children: true,
						_count: { select: { products: true } },
					},
				},
				_count: { select: { products: true } },
			},
			orderBy: { name: 'asc' },
		})
	}),

	getBySlug: baseProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.category.findUnique({
			where: { slug: input },
			include: {
				children: true,
				parent: true,
				_count: { select: { products: true } },
			},
		})
	}),

	getNav: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.category.findMany({
			where: { parentId: null },
			select: { id: true, name: true, slug: true },
			orderBy: { name: 'asc' },
		})
	}),

	getProductsByCategorySlug: baseProcedure
		.input(
			z.object({
				slug: z.string(),
				includeChildren: z.boolean().default(false),
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				sortBy: z
					.enum(['price-asc', 'price-desc', 'name', 'newest', 'rating'])
					.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { slug, includeChildren, page, limit, sortBy } = input

			const category = await ctx.prisma.category.findUnique({
				where: { slug },
				select: { id: true, name: true, children: { select: { id: true } } },
			})

			if (!category) return { items: [], total: 0, page, limit, totalPages: 0 }

			const categoryIds = [category.id]
			if (includeChildren) {
				categoryIds.push(...category.children.map(c => c.id))
			}

			const where = { isActive: true, categoryId: { in: categoryIds } }

			let orderBy: Record<string, string> = { createdAt: 'desc' }
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
						images: {
							orderBy: { order: 'asc' },
							select: productImageSelect,
						},
						brand: true,
						brandCountry: true,
						rating: true,
						reviewsCount: true,
						badges: true,
						isActive: true,
						categoryId: true,
						createdAt: true,
						category: { select: { name: true, slug: true } },
					},
				}),
				ctx.prisma.product.count({ where }),
			])

			return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
		}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				slug: z.string().optional(),
				description: z.string().optional(),
				image: z.string().optional(),
				parentId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			let slug = input.slug?.trim() || generateSlug(input.name)
			let suffix = 0
			while (await ctx.prisma.category.findUnique({ where: { slug } })) {
				suffix++
				slug = `${generateSlug(input.name)}-${suffix}`
			}
			return ctx.prisma.category.create({ data: { ...input, slug } })
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				slug: z.string().optional(),
				description: z.string().optional(),
				image: z.string().optional(),
				parentId: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			if (data.name && !data.slug) {
				let slug = generateSlug(data.name)
				let suffix = 0
				while (
					await ctx.prisma.category.findFirst({
						where: { slug, id: { not: id } },
					})
				) {
					suffix++
					slug = `${generateSlug(data.name)}-${suffix}`
				}
				data.slug = slug
			}
			return ctx.prisma.category.update({ where: { id }, data })
		}),

	updateImagePath: adminProcedure
		.input(
			z.object({
				categoryId: z.string(),
				imagePath: z.string().nullable(),
				imageOriginalName: z.string().nullable().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.category.update({
				where: { id: input.categoryId },
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
			const category = await ctx.prisma.category.findUnique({
				where: { id: input },
				select: { imagePath: true },
			})

			if (category?.imagePath) {
				try {
					await deleteFile(category.imagePath)
				} catch {
					/* file may not exist */
				}
			}

			return ctx.prisma.category.update({
				where: { id: input },
				data: { imagePath: null, imageOriginalName: null },
				select: { id: true },
			})
		}),

	delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.category.delete({ where: { id: input } })
	}),
})
