import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/HeaderServer'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import CategoryContent from './CategoryContent'
import { Suspense } from 'react'
import { trpc, HydrateClient } from '@/lib/trpc/server'
import type { Metadata } from 'next'
import { getMetadataForCategory, seoToMetadata } from '@/lib/seo/getMetadata'
import { CategoryContentSkeleton } from '@/shared/ui/storefront-skeletons'
import { prisma } from '@/lib/prisma'
import BreadcrumbStructuredData from '@/shared/ui/BreadcrumbStructuredData'

export const revalidate = 3600 // 1 час ISR
export const dynamicParams = true

export async function generateStaticParams() {
	try {
		const categories = await prisma.category.findMany({
			select: { slug: true },
		})
		return categories.map(c => ({ slug: c.slug }))
	} catch (error) {
		console.warn('[catalog] generateStaticParams: database unavailable', error)
		return []
	}
}

const PROPERTY_PARAM_PREFIX = 'prop.'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const category = await trpc.categories.getBySlug(slug)
	if (!category) return { title: 'Категория не найдена' }

	const seo = await getMetadataForCategory({
		id: category.id,
		name: category.name,
		description: category.description,
	})
	return seoToMetadata(seo)
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

	// Получаем имя категории для BreadcrumbList (React cache deduplicates)
	const category = await trpc.categories.getBySlug(slug)

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
			{category && (
				<BreadcrumbStructuredData
					items={[
						{ name: 'Главная', href: '/' },
						{ name: 'Каталог', href: '/catalog' },
						{ name: category.name },
					]}
				/>
			)}
			<div className='flex flex-col bg-background'>
				<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
					<TopBar />
					<Header />
					<CategoryNav />

					<Suspense
						fallback={<CategoryContentSkeleton />}
					>
						<CategoryContent slug={slug} />
					</Suspense>
				</main>

				<Footer />
				<ChatButton />
			</div>
		</HydrateClient>
	)
}
