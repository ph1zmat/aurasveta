import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import ProductGallery from '@/features/product-details/ui/ProductGallery'
import ProductPriceBlock from '@/features/product-details/ui/ProductPriceBlock'
import QuickSpecs from '@/features/product-details/ui/QuickSpecs'
import DesignProjectBanner from '@/features/product-details/ui/DesignProjectBanner'
import InterestCounter from '@/features/product-details/ui/InterestCounter'
import DeliveryAdvantages from '@/features/product-details/ui/DeliveryAdvantages'
// Ниже fold — загружаются после LCP
const ProductTabs = dynamic(() => import('@/features/product-details/ui/ProductTabs'))
const ProductCarousel = dynamic(() => import('@/widgets/product-carousel/ui/ProductCarousel'))
// Только при скролле / нет SSR-HTML
const StickyHeaderWithTrigger = dynamic(
	() => import('@/features/product-details/ui/StickyHeaderWithTrigger'),
)
// Чисто client-side аналитика, нет HTML
const TrackRecentlyViewed = dynamic(
	() => import('@/features/product-details/ui/TrackRecentlyViewed'),
)
import ProductStructuredData from '@/shared/ui/ProductStructuredData'
import BreadcrumbStructuredData from '@/shared/ui/BreadcrumbStructuredData'
import BackToListLink from '@/shared/ui/BackToListLink'
import ProductBreadcrumbs from '@/features/product-details/ui/ProductBreadcrumbs'
import {
	CompareButton,
	AddToCartButton,
} from '@/features/product-details/ui/ProductActions'
import { prisma } from '@/lib/prisma'
import {
	getProductBySlug,
	getQuickSpecs,
	getProductSpecGroups,
} from '@/entities/product/api/productService'
import {
	type DbProduct,
	toCatalogCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { notFound } from 'next/navigation'
import { trpc } from '@/lib/trpc/server'
import { getMetadataForProduct, seoToMetadata } from '@/lib/seo/getMetadata'
import {
	getProductImageUrl,
	normalizeProductImages,
} from '@/shared/lib/product-utils'
import { ProductCarouselSkeleton } from '@/shared/ui/storefront-skeletons'

/* ── Page ── */

export const revalidate = 1800 // 30 мин ISR
export const dynamicParams = true

export async function generateStaticParams() {
	try {
		const products = await prisma.product.findMany({
			where: { isActive: true },
			orderBy: { createdAt: 'desc' },
			take: 500,
			select: { slug: true },
		})
		return products.map(p => ({ slug: p.slug }))
	} catch (error) {
		console.warn('[product] generateStaticParams: database unavailable', error)
		return []
	}
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const product = await getProductBySlug(slug)
	if (!product) return { title: 'Товар не найден' }

	const seo = await getMetadataForProduct({
		id: String(product.id),
		name: product.name,
		description: product.description,
		metaTitle: product.metaTitle,
		metaDesc: product.metaDesc,
		price: product.price,
		images: product.images,
		brand: product.brand,
	})
	return seoToMetadata(seo)
}

export default async function ProductPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const product = await getProductBySlug(slug)
	if (!product) notFound()

	const productId = String(product.id)

	// Прогреваем рекомендации параллельно с основными данными (React cache dedupe)
	void trpc.recommendations.getSimilarProducts({ productId, limit: 5 })
	void trpc.recommendations.getProductsFromBrand({ productId, limit: 5 })

	const [quickSpecs, specGroups] = await Promise.all([
		getQuickSpecs(product.id),
		getProductSpecGroups(product.id),
	])

	const allImages = normalizeProductImages(product.images).map(
		image => image.url,
	)
	const productImages = allImages.length > 0 ? allImages : ['/bulb.svg']
	return (
		<div className='flex flex-col bg-background'>
			<TrackRecentlyViewed productId={String(product.id)} />
			<ProductStructuredData
				name={product.name}
				description={product.description}
				price={product.price}
				images={allImages}
				sku={product.slug}
				brand={product.brand}
				inStock={product.inStock}
				rating={product.rating}
				reviewsCount={product.reviewsCount}
				url={`https://aurasveta.by/product/${product.slug}`}
			/>
			<BreadcrumbStructuredData
				items={[
					{ name: 'Главная', href: '/' },
					{ name: 'Каталог', href: '/catalog' },
					...(product.category && product.categorySlug
						? [{ name: product.category, href: `/catalog/${product.categorySlug}` }]
						: []),
					{ name: product.name },
				]}
			/>
			{/* Sticky header on scroll */}
			<StickyHeaderWithTrigger
				triggerId='product-tabs'
				name={product.name}
				image={getProductImageUrl(product)}
				price={product.price}
				discountPercent={product.discountPercent}
				bonusAmount={product.bonusAmount}
			/>

			<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				<div className='pt-4'>
					<BackToListLink fallbackHref='/catalog' label='Назад к списку' />
				</div>

				{/* Breadcrumbs */}
				<ProductBreadcrumbs
					productName={product.name}
					categoryName={product.category}
					categoryHref={
						product.categorySlug
							? `/catalog/${product.categorySlug}`
							: undefined
					}
				/>

				{/* Product title + article */}
				<div className='mb-6'>
					<h1 className='text-xl font-semibold tracking-widest text-foreground lg:text-2xl'>
						{product.name}
					</h1>
					<div className='mt-1 flex items-center gap-4'>
						<span className='text-xs text-muted-foreground'>
							Артикул: {product.slug}
						</span>
						<CompareButton productId={String(product.id)} />
					</div>
				</div>

				{/* Main content: Gallery + Right sidebar */}
				<div className='flex flex-col gap-8 lg:flex-row'>
					{/* Left: Gallery */}
					<div className='lg:w-[55%]'>
						<ProductGallery images={productImages} alt={product.name} />
						{/* Interest counter */}
						<InterestCounter views={24} />

						{/* Delivery advantages */}
						<DeliveryAdvantages />

						{/* Tabs + Specs (two-column layout with sticky sidebar) */}
						<div id='product-tabs' className='flex gap-4 py-6 md:gap-8 md:py-8'>
							{/* Left: Tabs content */}
							<div className='min-w-0 flex-1'>
								<ProductTabs specGroups={specGroups} />
							</div>
						</div>
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
								cartAction={
									<AddToCartButton
										productId={String(product.id)}
										label={product.inStock ? 'В КОРЗИНУ' : 'УТОЧНИТЬ НАЛИЧИЕ'}
									/>
								}
							/>

							<QuickSpecs specs={quickSpecs} />

							<DesignProjectBanner />
						</div>
					</div>
				</div>

				{/* Similar products carousel — streamed independently */}
				<Suspense fallback={<ProductCarouselSkeleton />}>
					<SimilarProductsSection productId={productId} />
				</Suspense>

				{/* Collection products carousel — streamed independently */}
				<Suspense fallback={<ProductCarouselSkeleton />}>
					<CollectionProductsSection productId={productId} />
				</Suspense>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}

async function SimilarProductsSection({ productId }: { productId: string }) {
	const similarRaw = await trpc.recommendations.getSimilarProducts({
		productId,
		limit: 5,
	})
	const products = similarRaw.map(product =>
		toCatalogCardProps(toFrontendProduct(product as unknown as DbProduct)),
	)
	if (products.length === 0) return null
	return <ProductCarousel title='Похожие товары' products={products} />
}

async function CollectionProductsSection({ productId }: { productId: string }) {
	const brandRaw = await trpc.recommendations.getProductsFromBrand({
		productId,
		limit: 5,
	})
	const products = brandRaw.map(product =>
		toCatalogCardProps(toFrontendProduct(product as unknown as DbProduct)),
	)
	if (products.length === 0) return null
	return (
		<ProductCarousel title='Товары из этой коллекции' products={products} />
	)
}
