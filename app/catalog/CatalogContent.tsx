'use client'

import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import CatalogCategoryCarousel from '@/entities/category/ui/CatalogCategoryCarousel'
import CategorySection from '@/entities/category/ui/CategorySection'
import InteractiveCatalogCard from '@/entities/product/ui/InteractiveCatalogCard'
import {
	type DbProduct,
	toCatalogCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { resolveStorageFileUrl } from '@/shared/lib/storage-file-url'

type CategoryTreeNode = RouterOutputs['categories']['getTree'][number]
type CatalogCategoryCard = {
	id: string
	slug: string
	name: string
	href: string
	image: string
	productCount: number
}

function CatalogCategoryProductsSection({
	category,
}: {
	category: CatalogCategoryCard
}) {
	const { data } = trpc.products.getMany.useQuery(
		{
			categorySlug: category.slug,
			includeChildren: true,
			page: 1,
			limit: 4,
			sortBy: 'newest',
		},
		{ staleTime: 3 * 60 * 1000 },
	)

	const products = (data?.items ?? [])
		.map(p => toFrontendProduct(p as unknown as DbProduct))
		.map(toCatalogCardProps)

	if (products.length === 0) return null

	return (
		<CategorySection
			title={category.name}
			allHref={`/catalog/${category.slug}`}
			allLabel={`Все ${category.name}`}
			products={products}
		/>
	)
}

export default function CatalogContent() {
	const { data: categoriesTree } = trpc.categories.getTree.useQuery(undefined, {
		staleTime: 5 * 60 * 1000,
	})
	const { data: fallbackProductsData } = trpc.products.getMany.useQuery(
		{
			page: 1,
			limit: 8,
			sortBy: 'newest',
		},
		{ staleTime: 3 * 60 * 1000 },
	)

	const categories: CatalogCategoryCard[] = (categoriesTree ?? []).map(
		(cat: CategoryTreeNode) => ({
		id: cat.id,
		slug: cat.slug,
		name: cat.name,
		href: `/catalog/${cat.slug}`,
		image:
			cat.imageUrl ??
			resolveStorageFileUrl(cat.imagePath ?? cat.image) ??
			'/images/categories/default.jpg',
		productCount: cat._count?.products ?? 0,
		}),
	)

	const fallbackProducts = (fallbackProductsData?.items ?? [])
		.map(product => toFrontendProduct(product as unknown as DbProduct))
		.map(toCatalogCardProps)

	const prioritizedCategories = [...categories]
		.sort((a, b) => b.productCount - a.productCount)
		.slice(0, 6)

	return (
		<>
			<CatalogCategoryCarousel categories={categories} />

			{prioritizedCategories.map(category => (
				<CatalogCategoryProductsSection key={category.id} category={category} />
			))}

			{fallbackProducts.length > 0 && (
				<section className='py-8'>
					<h2 className='mb-6 text-xl font-semibold uppercase tracking-widest text-foreground'>
						Популярные товары
					</h2>
					<div className='grid grid-cols-2 gap-6 lg:grid-cols-4'>
						{fallbackProducts.map(product => (
							<InteractiveCatalogCard key={product.productId} {...product} />
						))}
					</div>
				</section>
			)}

			{categories.length === 0 && (
				<p className='py-12 text-center text-sm text-muted-foreground'>
					Категории пока не добавлены
				</p>
			)}
		</>
	)
}
