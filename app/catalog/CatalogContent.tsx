'use client'

import { trpc } from '@/lib/trpc/client'
import CatalogCategoryCarousel from '@/entities/category/ui/CatalogCategoryCarousel'
import CategorySection from '@/entities/category/ui/CategorySection'
import {
	toCatalogCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'

export default function CatalogContent() {
	const { data: categoriesTree } = trpc.categories.getTree.useQuery()
	const { data: productsData } = trpc.products.getMany.useQuery({
		page: 1,
		limit: 100,
	})

	const categories = (categoriesTree ?? []).map(cat => ({
		id: cat.id,
		slug: cat.slug,
		name: cat.name,
		href: `/catalog/${cat.slug}`,
		image: cat.image ?? '/images/categories/default.jpg',
		productCount: cat._count?.products ?? 0,
	}))

	const allProducts = (productsData?.items ?? []).map(toFrontendProduct)

	// Group products by category (show first 2 categories with products)
	const categorySections = categories
		.filter(cat => {
			const prods = allProducts.filter(p => p.category === cat.name)
			return prods.length > 0
		})
		.slice(0, 4)

	return (
		<>
			<CatalogCategoryCarousel categories={categories} />

			{categorySections.map(cat => {
				const prods = allProducts
					.filter(p => p.category === cat.name)
					.slice(0, 4)
					.map(toCatalogCardProps)

				return (
					<CategorySection
						key={cat.id}
						title={cat.name}
						allHref={`/catalog/${cat.slug}`}
						allLabel={`Все ${cat.name}`}
						products={prods}
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
