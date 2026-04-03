import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import CategoryNav from '@/components/layout/CategoryNav'
import Footer from '@/components/layout/Footer'
import ChatButton from '@/components/ui/ChatButton'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import ProductGallery from '@/components/product/ProductGallery'
import ProductPriceBlock from '@/components/product/ProductPriceBlock'
import QuickSpecs from '@/components/product/QuickSpecs'
import DesignProjectBanner from '@/components/product/DesignProjectBanner'
import InterestCounter from '@/components/product/InterestCounter'
import DeliveryAdvantages from '@/components/product/DeliveryAdvantages'
import ProductTabs from '@/components/product/ProductTabs'
import ProductCarousel from '@/components/product/ProductCarousel'
import StickyProductHeader from '@/components/product/StickyProductHeader'
import TagsSection from '@/components/catalog/TagsSection'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { SpecGroup } from '@/components/product/ProductTabs'
import type { SpecItem } from '@/components/product/QuickSpecs'
import {
	getProductBySlug,
	getAllProducts,
	getQuickSpecs,
	getProductSpecGroups,
} from '@/services/productService'
import { toCatalogCardProps } from '@/services/productAdapters'
import { notFound } from 'next/navigation'
import { mockCategoryProductTags, mockInterestTags } from '@/mocks/tags'

/* ── Page ── */

export async function generateStaticParams() {
	const products = await getAllProducts()
	return products.map(p => ({ slug: p.slug }))
}

export default async function ProductPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const product = await getProductBySlug(slug)
	if (!product) notFound()

	const quickSpecs = await getQuickSpecs(product.id)
	const specGroups = await getProductSpecGroups(product.id)
	const categoryTags = mockCategoryProductTags[product.category] ?? []
	const interestTags = mockInterestTags

	const allProducts = await getAllProducts()
	const similarProducts = allProducts
		.filter(p => p.category === product.category && p.id !== product.id)
		.slice(0, 5)
		.map(toCatalogCardProps)

	const collectionProducts = allProducts
		.filter(p => p.brand === product.brand && p.id !== product.id)
		.slice(0, 5)
		.map(toCatalogCardProps)

	const productImages =
		product.images.length > 0 ? product.images : ['/bulb.svg']
	return (
		<div className='flex min-h-screen flex-col bg-background'>
			{/* Sticky header on scroll */}
			<StickyProductHeader
				name={product.name}
				image={productImages[0]}
				price={product.price}
				discountPercent={product.discountPercent}
				bonusAmount={product.bonusAmount}
			/>

			<main className='flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />

				{/* Breadcrumbs */}
				<Breadcrumbs
					items={[
						{ label: 'Главная', href: '/' },
						{ label: 'Каталог', href: '/catalog' },
						{ label: product.category, href: '/catalog' },
						{ label: product.name },
					]}
				/>

				{/* Product title + article */}
				<div className='mb-6'>
					<h1 className='text-xl font-bold text-foreground lg:text-2xl'>
						{product.name}
					</h1>
					<div className='mt-1 flex items-center gap-4'>
						<span className='text-xs text-muted-foreground'>
							Артикул: {product.slug}
						</span>
						<Button variant='link' size='inline-xs'>
							<BarChart3 className='h-3.5 w-3.5' strokeWidth={1.5} />В сравнение
						</Button>
					</div>
				</div>

				{/* Main content: Gallery + Right sidebar */}
				<div className='flex flex-col gap-8 lg:flex-row'>
					{/* Left: Gallery */}
					<div className='lg:w-[55%]'>
						<ProductGallery images={productImages} alt={product.name} />
					</div>

					{/* Right: Price block + specs */}
					<div className='lg:w-[45%]'>
						<div className='lg:sticky lg:top-4 space-y-4'>
							<ProductPriceBlock
								price={product.price}
								oldPrice={product.oldPrice}
								discountPercent={product.discountPercent}
								bonusAmount={product.bonusAmount}
								availability={
									product.inStock
										? product.stockQuantity
											? `В наличии ${product.stockQuantity} шт.`
											: 'В наличии'
										: 'Наличие уточняйте у менеджера'
								}
							/>

							<QuickSpecs specs={quickSpecs} />

							<DesignProjectBanner />
						</div>
					</div>
				</div>

				{/* Interest counter */}
				<InterestCounter views={24} />

				{/* Delivery advantages */}
				<DeliveryAdvantages />

				{/* Tabs + Specs (two-column layout with sticky sidebar) */}
				<div className='flex gap-4 py-6 md:gap-8 md:py-8'>
					{/* Left: Tabs content */}
					<div className='min-w-0 flex-1'>
						<ProductTabs specGroups={specGroups} />
					</div>

					{/* Right: Sticky specs summary (desktop only) */}
					<div className='hidden w-80 shrink-0 lg:block'>
						<div className='sticky top-4 space-y-4'>
							<QuickSpecs specs={quickSpecs} />
							<DesignProjectBanner />
						</div>
					</div>
				</div>

				{/* Similar products carousel */}
				<ProductCarousel title='Похожие товары' products={similarProducts} />

				{/* Collection products carousel */}
				<ProductCarousel
					title='Товары из этой коллекции'
					products={collectionProducts}
				/>

				{/* Popular in category tags */}
				<div className='py-8'>
					<TagsSection
						title='Популярные в категории «Споты»'
						tags={categoryTags}
					/>
				</div>

				{/* You may be interested tags */}
				<div className='pb-8'>
					<TagsSection title='Вам может быть интересно' tags={interestTags} />
				</div>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}
