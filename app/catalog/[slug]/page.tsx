import TopBar from '@/widgets/header/ui/topbar'
import Header from '@/widgets/header/ui/headerserver'
import CategoryNav from '@/widgets/navigation/ui/categorynav'
import Footer from '@/widgets/footer/ui/footer'
import CategoryContent from './categorycontent'
import { Suspense } from 'react'
import { trpc, HydrateClient } from '@/lib/trpc/server'
import type { Metadata } from 'next'
import { getMetadataForCategory, seoToMetadata } from '@/lib/seo/getmetadata'
import { CategoryContentSkeleton } from '@/shared/ui/storefrontskeletons'
import { prisma } from '@/lib/prisma'
import BreadcrumbStructuredData from '@/shared/ui/breadcrumbstructureddata'
import ItemListStructuredData from '@/shared/ui/itemliststructureddata'
import { notFound } from 'next/navigation'
import { logDatabaseFallback } from '@/lib/utils/dbfallbacklogger'

export const revalidate = 3600 // 1 час ISR
export const dynamicParams = true

const BASE_URL = 'https://aurasveta.by'

export async function generateStaticParams() {
	try {
		const categories = await prisma.category.findMany({
			select: { slug: true },
		})
		return categories.map(c => ({ slug: c.slug }))
	} catch (error) {
		logDatabaseFallback('catalog.generate-static-params', error)
		return []
	}
}

const PROPERTY_PARAM_PREFIX = 'prop.'

function hasActiveQueryParams(params: Record<string, string | string[] | undefined>) {
	return Object.values(params).some(value => {
		if (Array.isArray(value)) {
			return value.some(item => typeof item === 'string' && item.trim().length > 0)
		}

		return typeof value === 'string' && value.trim().length > 0
	})
}

async function buildCategoryBreadcrumbSchemaItems(category: {
	name: string
	slug: string
	parentId?: string | null
}) {
	const parentItems: Array<{ name: string; href: string }> = []
	let parentId = category.parentId ?? null
	let guard = 0

	while (parentId && guard < 8) {
		const parent = await prisma.category.findUnique({
			where: { id: parentId },
			select: {
				id: true,
				name: true,
				slug: true,
				parentId: true,
			},
		})

		if (!parent) break

		parentItems.unshift({
			name: parent.name,
			href: `/catalog/${parent.slug}`,
		})

		parentId = parent.parentId
		guard++
	}

	return [
		{ name: 'Главная', href: '/' },
		{ name: 'Каталог', href: '/catalog' },
		...parentItems,
		{ name: category.name },
	]
}

export async function generateMetadata({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>
	searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
	const { slug } = await params
	const sp = await searchParams
	const category = await trpc.categories.getBySlug(slug)
	if (!category) notFound()

	const seo = await getMetadataForCategory({
		id: category.id,
		name: category.name,
		description: category.description,
	})
	const metadata = seoToMetadata(seo)
	const canonical =
		metadata.alternates?.canonical ?? `https://aurasveta.by/catalog/${slug}`

	const hasQueryParams = hasActiveQueryParams(sp)

	if (!hasQueryParams) {
		return {
			...metadata,
			alternates: {
				...(metadata.alternates ?? {}),
				canonical,
			},
		}
	}

	return {
		...metadata,
		alternates: {
			...(metadata.alternates ?? {}),
			canonical,
		},
		robots: {
			index: false,
			follow: true,
		},
	}
}

export default async function CategoryPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const { slug } = await params
	const sp = await searchParams

	// Parse search params for prefetch with actual filters
	const page = Number(sp.page ?? '1')
	const search = (sp.search as string) || undefined
	const sortBy =
		(sp.sort as 'price-asc' | 'price-desc' | 'name' | 'newest' | 'rating') ??
		undefined
	const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined
	const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined
	const isNew = sp.isNew === '1' || undefined
	const onSale = sp.onSale === '1' || undefined
	const freeShipping = sp.freeShipping === '1' || undefined

	// Parse dynamic property filters
	const properties: Record<string, string[]> = {}
	for (const [key, value] of Object.entries(sp)) {
		if (key.startsWith(PROPERTY_PARAM_PREFIX) && typeof value === 'string') {
			const propKey = key.slice(PROPERTY_PARAM_PREFIX.length)
			if (propKey) {
				properties[propKey] = value
					.split(',')
					.map(v => v.trim())
					.filter(Boolean)
			}
		}
	}
	const hasProperties = Object.keys(properties).length > 0
	const hasQueryParams = hasActiveQueryParams(sp)

	// Получаем имя категории для BreadcrumbList (React cache deduplicates)
	const category = await trpc.categories.getBySlug(slug)
	const schemaBreadcrumbItems = category
		? await buildCategoryBreadcrumbSchemaItems({
				name: category.name,
				slug: category.slug,
				parentId: category.parentId,
			})
		: null

	const shouldRenderItemListSchema = !hasQueryParams && page === 1
	const schemaProducts =
		category && shouldRenderItemListSchema
			? await trpc.products.getMany({
					categorySlug: slug,
					includeChildren: true,
					page,
					limit: 12,
					search,
					sortBy,
					minPrice,
					maxPrice,
					isNew,
					onSale,
					freeShipping,
					properties: hasProperties ? properties : undefined,
				})
			: null

	// Prefetch category, tree, filters, and products with actual URL params
	void trpc.categories.getBySlug.prefetch(slug)
	void trpc.categories.getTree.prefetch()
	void trpc.products.getAvailableFilters.prefetch({
		categorySlug: slug,
		includeChildren: true,
	})
	void trpc.products.getMany.prefetch({
		categorySlug: slug,
		includeChildren: true,
		page,
		limit: 12,
		search,
		sortBy,
		minPrice,
		maxPrice,
		isNew,
		onSale,
		freeShipping,
		properties: hasProperties ? properties : undefined,
	})

	return (
		<HydrateClient>
			{schemaBreadcrumbItems && (
				<BreadcrumbStructuredData
					items={schemaBreadcrumbItems}
				/>
			)}
			{category && schemaProducts && (
				<ItemListStructuredData
					name={category.name}
					url={`${BASE_URL}/catalog/${slug}`}
					items={schemaProducts.items.map(product => {
						const firstImage = product.images.find(image => image.url)

						return {
							name: product.name,
							url: `${BASE_URL}/product/${product.slug}`,
							imageUrl:
								(product.imageUrl as string | undefined | null) ??
								firstImage?.url ??
								null,
							price: product.price,
							priceCurrency: 'BYN',
						}
					})}
				/>
			)}
			<div className='flex flex-col bg-background'>
				<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
					<TopBar />
					<Header />
					<CategoryNav />

					{/* SSR h1 для поисковых ботов: основной заголовок рендерится в client-компоненте */}
					{category && <h1 className='sr-only'>{category.name}</h1>}

					<Suspense fallback={<CategoryContentSkeleton />}>
						<CategoryContent slug={slug} />
					</Suspense>
				</main>

				<Footer />
			</div>
		</HydrateClient>
	)
}
