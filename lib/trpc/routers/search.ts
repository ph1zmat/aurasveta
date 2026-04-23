import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { createTRPCRouter, baseProcedure } from '../init'

const searchInput = z.object({
	query: z.string().min(1, 'Поисковый запрос не может быть пустым'),
	categorySlug: z.string().optional(),
	limit: z.number().min(1).max(50).default(12),
	cursor: z.number().optional(),
	sortBy: z
		.enum(['relevance', 'price_asc', 'price_desc', 'newest'])
		.default('relevance'),
	filters: z
		.object({
			minPrice: z.number().optional(),
			maxPrice: z.number().optional(),
			inStock: z.boolean().optional(),
		})
		.optional(),
})

interface SearchProductRow {
	id: string
	name: string
	slug: string
	description: string | null
	price: number | null
	compare_at_price: number | null
	stock: number
	sku: string | null
	main_image_url: string | null
	brand: string | null
	brand_country: string | null
	rating: number | null
	reviews_count: number
	badges: Prisma.JsonValue
	is_active: boolean
	category_id: string | null
	created_at: Date
	category_name: string | null
	category_slug: string | null
	rank: number
}

interface CountRow {
	count: bigint
}

export const searchRouter = createTRPCRouter({
	search: baseProcedure.input(searchInput).query(async ({ ctx, input }) => {
		const { query, categorySlug, limit, cursor, sortBy, filters } = input
		const offset = cursor ?? 0

		// Build ORDER BY (safe — no user input interpolation)
		let orderClause: string
		switch (sortBy) {
			case 'price_asc':
				orderClause = `p."price" ASC NULLS LAST`
				break
			case 'price_desc':
				orderClause = `p."price" DESC NULLS LAST`
				break
			case 'newest':
				orderClause = `p."created_at" DESC`
				break
			default:
				orderClause = `rank DESC`
		}

		// Build parameterized query dynamically
		const params: unknown[] = [query] // $1 = query
		let paramIndex = 2

		let filterClause = ''
		if (categorySlug) {
			filterClause += ` AND c."slug" = $${paramIndex}`
			params.push(categorySlug)
			paramIndex++
		}
		if (filters?.minPrice !== undefined) {
			filterClause += ` AND p."price" >= $${paramIndex}`
			params.push(filters.minPrice)
			paramIndex++
		}
		if (filters?.maxPrice !== undefined) {
			filterClause += ` AND p."price" <= $${paramIndex}`
			params.push(filters.maxPrice)
			paramIndex++
		}
		if (filters?.inStock === true) {
			filterClause += ` AND p."stock" > 0`
		}

		const limitParam = paramIndex
		params.push(limit + 1)
		paramIndex++
		const offsetParam = paramIndex
		params.push(offset)

		const items = await ctx.prisma.$queryRawUnsafe<SearchProductRow[]>(
			`
			SELECT
				p."id", p."name", p."slug", p."description",
				p."price", p."compare_at_price", p."stock", p."sku",
				pi."url" as main_image_url,
				p."brand", p."brand_country",
				p."rating", p."reviews_count", p."badges", p."is_active",
				p."category_id", p."created_at",
				c."name" as category_name, c."slug" as category_slug,
				ts_rank(p."search_vector", websearch_to_tsquery('russian', $1)) as rank
			FROM "products" p
			LEFT JOIN "categories" c ON p."category_id" = c."id"
			LEFT JOIN LATERAL (
				SELECT pi."url"
				FROM "product_images" pi
				WHERE pi."product_id" = p."id"
				ORDER BY pi."is_main" DESC, pi."order" ASC, pi."created_at" ASC
				LIMIT 1
			) pi ON true
			WHERE p."is_active" = true
				AND p."search_vector" @@ websearch_to_tsquery('russian', $1)
				${filterClause}
			ORDER BY ${orderClause}
			LIMIT $${limitParam}
			OFFSET $${offsetParam}
			`,
			...params,
		)

		const hasMore = items.length > limit
		const resultItems = hasMore ? items.slice(0, limit) : items

		// Count total — reuse same filter params (without limit/offset)
		const countParams = params.slice(0, -2) // remove limit and offset
		const countResult = await ctx.prisma.$queryRawUnsafe<CountRow[]>(
			`
			SELECT COUNT(*)::bigint as count
			FROM "products" p
			LEFT JOIN "categories" c ON p."category_id" = c."id"
			WHERE p."is_active" = true
				AND p."search_vector" @@ websearch_to_tsquery('russian', $1)
				${filterClause}
			`,
			...countParams,
		)

		const total = Number(countResult[0]?.count ?? 0)

		return {
			items: resultItems.map(row => ({
				id: row.id,
				name: row.name,
				slug: row.slug,
				description: row.description,
				price: row.price,
				compareAtPrice: row.compare_at_price,
				stock: row.stock,
				sku: row.sku,
				imageUrl: row.main_image_url,
				brand: row.brand,
				brandCountry: row.brand_country,
				rating: row.rating,
				reviewsCount: row.reviews_count,
				badges: row.badges,
				isActive: row.is_active,
				categoryId: row.category_id,
				createdAt: row.created_at,
				category: row.category_name
					? { name: row.category_name, slug: row.category_slug! }
					: null,
				rank: row.rank,
			})),
			total,
			nextCursor: hasMore ? offset + limit : undefined,
		}
	}),

	suggestions: baseProcedure
		.input(
			z.object({
				query: z.string().min(1),
				limit: z.number().min(1).max(10).default(5),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { query, limit } = input

			const items = await ctx.prisma.$queryRawUnsafe<
				{
					id: string
					name: string
					slug: string
					image_url: string | null
					price: number | null
					category_name: string | null
					category_slug: string | null
					rank: number
				}[]
			>(
				`
				SELECT
					p."id", p."name", p."slug", p."price",
					pi."url" as image_url,
					c."name" as category_name, c."slug" as category_slug,
					ts_rank(p."search_vector", websearch_to_tsquery('russian', $1)) as rank
				FROM "products" p
				LEFT JOIN "categories" c ON p."category_id" = c."id"
				LEFT JOIN LATERAL (
					SELECT pi."url"
					FROM "product_images" pi
					WHERE pi."product_id" = p."id"
					ORDER BY pi."is_main" DESC, pi."order" ASC, pi."created_at" ASC
					LIMIT 1
				) pi ON true
				WHERE p."is_active" = true
					AND p."search_vector" @@ websearch_to_tsquery('russian', $1)
				ORDER BY rank DESC
				LIMIT $2
				`,
				query,
				limit,
			)

			return items.map(row => ({
				id: row.id,
				name: row.name,
				slug: row.slug,
				imageUrl: row.image_url,
				price: row.price,
				category: row.category_name
					? { name: row.category_name, slug: row.category_slug! }
					: null,
			}))
		}),
})
