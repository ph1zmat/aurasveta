'use client'

import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import CatalogCategoryCarousel from '@/entities/category/ui/CatalogCategoryCarousel'
import CategorySection from '@/entities/category/ui/CategorySection'
import {
	type DbProduct,
	toCatalogCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { resolveStorageFileUrl } from '@/shared/lib/storage-file-url'

type CategoryTreeNode = RouterOutputs['categories']['getTree'][number]
type CatalogSectionItem = RouterOutputs['products']['getCatalogPage'][number]

export default function CatalogContent() {
	const { data: categoriesTree } = trpc.categories.getTree.useQuery(undefined, {
		staleTime: 5 * 60 * 1000,
	})
	const { data: catalogSections } = trpc.products.getCatalogPage.useQuery(
		{ categoryLimit: 6, productLimit: 4 },
		{ staleTime: 5 * 60 * 1000 },
	)

	const categories = (categoriesTree ?? []).map((cat: CategoryTreeNode) => ({
		id: cat.id,
		slug: cat.slug,
		name: cat.name,
		href: `/catalog/${cat.slug}`,
		image:
			cat.imageUrl ??
			resolveStorageFileUrl(cat.imagePath ?? cat.image) ??
			'/images/categories/default.jpg',
		productCount: cat._count?.products ?? 0,
	}))

	return (
		<>
			<CatalogCategoryCarousel categories={categories} />

			{(catalogSections ?? []).map((section: CatalogSectionItem) => {
				const products = section.products
					.map(p => toFrontendProduct(p as unknown as DbProduct))
					.map(toCatalogCardProps)

				if (products.length === 0) return null

				return (
					<CategorySection
						key={section.id}
						title={section.name}
						allHref={`/catalog/${section.slug}`}
						allLabel={`Все ${section.name}`}
						products={products}
					/>
				)
			})}

			{categories.length === 0 && (
				<p className='py-12 text-center text-sm text-muted-foreground'>
					Категории пока не добавлены
				</p>
			)}
		</>
	)
}
