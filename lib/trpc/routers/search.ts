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
	root_category_id: string | null
	subcategory_id: string | null
	created_at: Date
	category_name: string | null
	category_slug: string | null
	root_category_name: string | null
	root_category_slug: string | null
	subcategory_name: string | null
	subcategory_slug: string | null
	rank: number
}

interface CountRow {
	count: bigint
}

export const searchRouter = createTRPCRouter({
	search: baseProcedure.input(searchInput).query(async ({ ctx, input }) => {
		const { query, categorySlug, limit, cursor, sortBy, filters } = input
		const offset = cursor ?? 0
		const escapedLikeQuery = `%${query.replace(/[\\%_]/g, match => `\\${match}`)}%`

		// Build ORDER BY (safe — no user input interpolation)
		let orderClause: string
		switch (sortBy) {
			case 'price_asc':
				orderClause = `p."price" ASC NULLS LAST, rank DESC, p."id" ASC`
				break
			case 'price_desc':
				orderClause = `p."price" DESC NULLS LAST, rank DESC, p."id" ASC`
				break
			case 'newest':
				orderClause = `p."created_at" DESC, rank DESC, p."id" ASC`
				break
			default:
				orderClause = `rank DESC, p."created_at" DESC, p."id" ASC`
		}

		// Build parameterized query dynamically
		const params: unknown[] = [query, escapedLikeQuery] // $1 = tsquery, $2 = ILIKE fallback
		let paramIndex = 3

		let filterClause = ''
		if (categorySlug) {
			filterClause += ` AND (COALESCE(sc."slug", c."slug") = $${paramIndex} OR COALESCE(rc."slug", c."slug") = $${paramIndex})`
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
				p."category_id", p."root_category_id", p."subcategory_id", p."created_at",
				COALESCE(sc."name", c."name", rc."name") as category_name,
				COALESCE(sc."slug", c."slug", rc."slug") as category_slug,
				rc."name" as root_category_name, rc."slug" as root_category_slug,
				sc."name" as subcategory_name, sc."slug" as subcategory_slug,
				GREATEST(
					ts_rank(p."search_vector", websearch_to_tsquery('russian', $1)),
					CASE
						WHEN COALESCE(sc."name", c."name", rc."name", '') ILIKE $2 ESCAPE '\\' THEN 0.95
						WHEN COALESCE(rc."name", c."name", '') ILIKE $2 ESCAPE '\\' THEN 0.9
						WHEN p."name" ILIKE $2 ESCAPE '\\' THEN 0.85
						WHEN COALESCE(p."brand", '') ILIKE $2 ESCAPE '\\' THEN 0.45
						WHEN COALESCE(p."description", '') ILIKE $2 ESCAPE '\\' THEN 0.25
						ELSE 0
					END
				) as rank
			FROM "products" p
			LEFT JOIN "categories" c ON p."category_id" = c."id"
			LEFT JOIN "categories" rc ON p."root_category_id" = rc."id"
			LEFT JOIN "categories" sc ON p."subcategory_id" = sc."id"
			LEFT JOIN LATERAL (
				SELECT pi."url"
				FROM "product_images" pi
				WHERE pi."product_id" = p."id"
				ORDER BY pi."is_main" DESC, pi."order" ASC, pi."created_at" ASC
				LIMIT 1
			) pi ON true
			WHERE p."is_active" = true
				AND (
					p."search_vector" @@ websearch_to_tsquery('russian', $1)
					OR p."name" ILIKE $2 ESCAPE '\\'
					OR COALESCE(p."description", '') ILIKE $2 ESCAPE '\\'
					OR COALESCE(p."brand", '') ILIKE $2 ESCAPE '\\'
					OR COALESCE(sc."name", c."name", rc."name", '') ILIKE $2 ESCAPE '\\'
					OR COALESCE(sc."slug", c."slug", rc."slug", '') ILIKE $2 ESCAPE '\\'
				)
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
			LEFT JOIN "categories" rc ON p."root_category_id" = rc."id"
			LEFT JOIN "categories" sc ON p."subcategory_id" = sc."id"
			WHERE p."is_active" = true
				AND (
					p."search_vector" @@ websearch_to_tsquery('russian', $1)
					OR p."name" ILIKE $2 ESCAPE '\\'
					OR COALESCE(p."description", '') ILIKE $2 ESCAPE '\\'
					OR COALESCE(p."brand", '') ILIKE $2 ESCAPE '\\'
					OR COALESCE(sc."name", c."name", rc."name", '') ILIKE $2 ESCAPE '\\'
					OR COALESCE(sc."slug", c."slug", rc."slug", '') ILIKE $2 ESCAPE '\\'
				)
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
				rootCategoryId: row.root_category_id,
				subcategoryId: row.subcategory_id,
				createdAt: row.created_at,
				category: row.category_name
					? { name: row.category_name, slug: row.category_slug! }
					: null,
				rootCategory: row.root_category_name
					? { name: row.root_category_name, slug: row.root_category_slug! }
					: null,
				subcategory: row.subcategory_name
					? { name: row.subcategory_name, slug: row.subcategory_slug! }
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
			const escapedLikeQuery = `%${query.replace(/[\\%_]/g, match => `\\${match}`)}%`

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
					COALESCE(sc."name", c."name", rc."name") as category_name,
					COALESCE(sc."slug", c."slug", rc."slug") as category_slug,
					GREATEST(
						ts_rank(p."search_vector", websearch_to_tsquery('russian', $1)),
						CASE
							WHEN COALESCE(sc."name", c."name", rc."name", '') ILIKE $2 ESCAPE '\\' THEN 0.95
							WHEN COALESCE(rc."name", c."name", '') ILIKE $2 ESCAPE '\\' THEN 0.9
							WHEN p."name" ILIKE $2 ESCAPE '\\' THEN 0.85
							WHEN COALESCE(p."brand", '') ILIKE $2 ESCAPE '\\' THEN 0.45
							ELSE 0
						END
					) as rank
				FROM "products" p
				LEFT JOIN "categories" c ON p."category_id" = c."id"
				LEFT JOIN "categories" rc ON p."root_category_id" = rc."id"
				LEFT JOIN "categories" sc ON p."subcategory_id" = sc."id"
				LEFT JOIN LATERAL (
					SELECT pi."url"
					FROM "product_images" pi
					WHERE pi."product_id" = p."id"
					ORDER BY pi."is_main" DESC, pi."order" ASC, pi."created_at" ASC
					LIMIT 1
				) pi ON true
				WHERE p."is_active" = true
					AND (
						p."search_vector" @@ websearch_to_tsquery('russian', $1)
						OR p."name" ILIKE $2 ESCAPE '\\'
						OR COALESCE(p."description", '') ILIKE $2 ESCAPE '\\'
						OR COALESCE(p."brand", '') ILIKE $2 ESCAPE '\\'
						OR COALESCE(sc."name", c."name", rc."name", '') ILIKE $2 ESCAPE '\\'
						OR COALESCE(sc."slug", c."slug", rc."slug", '') ILIKE $2 ESCAPE '\\'
						OR COALESCE(rc."name", '') ILIKE $2 ESCAPE '\\'
						OR COALESCE(rc."slug", '') ILIKE $2 ESCAPE '\\'
					)
				ORDER BY rank DESC, p."created_at" DESC, p."id" ASC
				LIMIT $3
				`,
				query,
				escapedLikeQuery,
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
