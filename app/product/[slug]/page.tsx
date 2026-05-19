import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import TopBar from '@/widgets/header/ui/topbar'
import Header from '@/widgets/header/ui/headerserver'
import CategoryNav from '@/widgets/navigation/ui/categorynav'
import Footer from '@/widgets/footer/ui/footer'
import ProductGallery from '@/features/product-details/ui/productgallery'
import ProductPriceBlock from '@/features/product-details/ui/productpriceblock'
import InterestCounter from '@/features/product-details/ui/interestcounter'
import DeliveryAdvantages from '@/features/product-details/ui/deliveryadvantages'
// Ниже fold — загружаются после LCP
const ProductTabs = dynamic(
	() => import('@/features/product-details/ui/producttabs'),
)
const ProductCarousel = dynamic(
	() => import('@/widgets/product-carousel/ui/productcarousel'),
)
// Только при скролле / нет SSR-HTML
const StickyHeaderWithTrigger = dynamic(
	() => import('@/features/product-details/ui/stickyheaderwithtrigger'),
)
// Чисто client-side аналитика, нет HTML
const TrackRecentlyViewed = dynamic(
	() => import('@/features/product-details/ui/trackrecentlyviewed'),
)
import ProductStructuredData from '@/shared/ui/productstructureddata'
import BreadcrumbStructuredData from '@/shared/ui/breadcrumbstructureddata'
import BackToListLink from '@/shared/ui/backtolistlink'
import ProductBreadcrumbs from '@/features/product-details/ui/productbreadcrumbs'
import {
	CompareButton,
	AddToCartButton,
} from '@/features/product-details/ui/productactions'
import { prisma } from '@/lib/prisma'
import {
	getProductBySlug,
	getProductSpecGroups,
} from '@/entities/product/api/productservice'
import {
	type DbProduct,
	toCatalogCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { notFound } from 'next/navigation'
import { trpc } from '@/lib/trpc/server'
import {
	getMetadataForProduct,
	seoToProductMetadata,
} from '@/lib/seo/getmetadata'
import {
	getProductImageUrl,
	getResolvedProductImageUrl,
	normalizeProductImages,
} from '@/shared/lib/productutils'
import { ProductCarouselSkeleton } from '@/shared/ui/storefrontskeletons'
import RecentlyViewedProductCarousel from '@/widgets/product-carousel/ui/recentlyviewedproductcarousel'
import { getEffectiveMerchantPolicies } from '@/lib/merchant-policies/geteffectivemerchantpolicies'
import { logDatabaseFallback } from '@/lib/utils/dbfallbacklogger'

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
		logDatabaseFallback('product.generate-static-params', error)
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
	if (!product) notFound()

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
  const canonicalUrl = `https://aurasveta.by/product/${slug}`
	const metadata = seoToProductMetadata(seo, {
		canonicalUrl,
		imageUrl: getProductImageUrl(product),
		price: product.price,
		inStock: product.inStock,
		currency: 'BYN',
	})

	return metadata
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

	const [specGroups, productViews, deliveryAdvantagesSetting, effectivePolicies] =
		await Promise.all([
			getProductSpecGroups(product.id),
			prisma.productView.count({ where: { productId } }).catch(() => 0),
			prisma.setting
				.findUnique({ where: { key: 'delivery.advantages' } })
				.catch(() => null),
			getEffectiveMerchantPolicies(prisma, productId),
		])

	const allImages = normalizeProductImages(product.images)
		.map(image => getResolvedProductImageUrl(image))
		.filter((imageUrl): imageUrl is string => Boolean(imageUrl))
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
				condition={product.condition}
				inStock={product.inStock}
				rating={product.rating}
				reviewsCount={product.reviewsCount}
				url={`https://aurasveta.by/product/${product.slug}`}
				shippingPolicy={
					effectivePolicies.shippingPolicy
						? {
								countryCode: effectivePolicies.shippingPolicy.countryCode,
								currency: effectivePolicies.shippingPolicy.currency,
								shippingRate: effectivePolicies.shippingPolicy.shippingRate,
								minTransitDays: effectivePolicies.shippingPolicy.minTransitDays,
								maxTransitDays: effectivePolicies.shippingPolicy.maxTransitDays,
							}
						: null
				}
				returnPolicy={
					effectivePolicies.returnPolicy
						? {
								returnPolicyCategory:
									effectivePolicies.returnPolicy.returnPolicyCategory,
								merchantReturnDays:
									effectivePolicies.returnPolicy.merchantReturnDays,
								returnMethod: effectivePolicies.returnPolicy.returnMethod,
								returnFees: effectivePolicies.returnPolicy.returnFees,
							}
						: null
				}
				warrantyPolicy={
					effectivePolicies.warrantyPolicy
						? {
								durationMonths:
									effectivePolicies.warrantyPolicy.durationMonths,
								warrantyScope:
									effectivePolicies.warrantyPolicy.warrantyScope,
							}
						: null
				}
			/>
			<BreadcrumbStructuredData
				items={[
					{ name: 'Главная', href: '/' },
					{ name: 'Каталог', href: '/catalog' },
					...(product.category && product.categorySlug
						? [
								{
									name: product.category,
									href: `/catalog/${product.categorySlug}`,
								},
							]
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
					<div className='lg:w-[55%] flex flex-col gap-6'>
						<ProductGallery images={productImages} alt={product.name} />
						{/* Interest counter */}
						{productViews >= 5 && <InterestCounter views={productViews} />}

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

							{/* Delivery advantages */}
							<DeliveryAdvantages dbValue={deliveryAdvantagesSetting?.value} />
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

				<RecentlyViewedProductCarousel
					excludeProductId={productId}
					title='Вы смотрели'
					limit={5}
				/>
			</main>

			<Footer />
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
