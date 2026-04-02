import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import CategoryNav from '@/components/layout/CategoryNav'
import Footer from '@/components/layout/Footer'
import ChatButton from '@/components/ui/ChatButton'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import CatalogSidebar from '@/components/catalog/CatalogSidebar'
import SubcategoryCarousel from '@/components/catalog/SubcategoryCarousel'
import ViewToggle from '@/components/catalog/ViewToggle'
import ResultsBar from '@/components/catalog/ResultsBar'
import TagsSection from '@/components/catalog/TagsSection'
import CatalogProductCard from '@/components/ui/CatalogProductCard'
import Pagination from '@/components/catalog/Pagination'
import SEOText from '@/components/catalog/SEOText'
import { mockProducts } from '@/mocks/products'
import { toCatalogCardProps } from '@/services/productAdapters'
import {
	mockCategories,
	mockCategoryTrees,
	mockSubcategories,
	categorySlugToName,
} from '@/mocks/categories'
import { mockPopularTags, mockCollectionTags } from '@/mocks/tags'
import { getSeoContentFor } from '@/mocks/specs'
import { notFound } from 'next/navigation'

/* ── Static params ── */

export function generateStaticParams() {
	return mockCategories.map(c => ({ slug: c.slug }))
}

/* ── Page ── */

export default async function CategoryPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params

	const categoryName = categorySlugToName[slug]
	if (!categoryName) notFound()

	const categoryTree = mockCategoryTrees[slug] ?? []
	const subcategories = mockSubcategories[slug] ?? []
	const popularTags = mockPopularTags[slug] ?? []
	const collectionTags = mockCollectionTags
	const seoContent = getSeoContentFor(slug)

	const products = mockProducts
		.filter(p => p.category === categoryName)
		.concat(mockProducts.filter(p => p.category !== categoryName))
		.slice(0, 12)
		.map(toCatalogCardProps)

	const totalProducts = mockProducts.filter(
		p => p.category === categoryName,
	).length

	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<main className='flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				{/* Breadcrumbs */}
				<Breadcrumbs
					items={[
						{ label: 'Главная', href: '/' },
						{ label: 'Каталог', href: '/catalog' },
						{ label: categoryName },
					]}
				/>

				{/* Two-column layout */}
				<div className='flex gap-8'>
					{/* Sidebar */}
					<div className='hidden w-64 shrink-0 lg:block'>
						<CatalogSidebar
							categoryTree={categoryTree}
							activeCategoryPath={`/catalog/${slug}`}
						/>
					</div>

					{/* Content */}
					<div className='min-w-0 flex-1'>
						{/* Category heading + toggle */}
						<div className='mb-4 flex items-start justify-between'>
							<h1 className='text-2xl font-bold uppercase tracking-wider text-foreground'>
								{categoryName}
							</h1>
							<ViewToggle />
						</div>

						{/* Subcategory carousel */}
						<SubcategoryCarousel items={subcategories} />

						{/* Results bar */}
						<ResultsBar total={totalProducts} />

						{/* Popular search tags */}
						<TagsSection title='Часто ищут' tags={popularTags} />

						{/* Collection tags */}
						<TagsSection title='Подборки' tags={collectionTags} />

						{/* Product grid — 3 columns */}
						<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'>
							{products.map(product => (
								<CatalogProductCard key={product.href} {...product} />
							))}
						</div>

						{/* Load more button */}
						<div className='mt-8 flex justify-center'>
							<button className='rounded-sm bg-foreground px-8 py-3 text-sm font-medium uppercase tracking-wider text-card transition-colors hover:bg-foreground/90'>
								Показать ещё
							</button>
						</div>

						{/* Pagination */}
						<Pagination
							currentPage={1}
							totalPages={Math.ceil(totalProducts / 12)}
						/>

						{/* SEO text */}
						<SEOText content={seoContent} />
					</div>
				</div>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}
