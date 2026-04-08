import type { Metadata } from 'next'
import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'
import ProductGallery from '@/features/product-details/ui/ProductGallery'
import ProductPriceBlock from '@/features/product-details/ui/ProductPriceBlock'
import QuickSpecs from '@/features/product-details/ui/QuickSpecs'
import DesignProjectBanner from '@/features/product-details/ui/DesignProjectBanner'
import InterestCounter from '@/features/product-details/ui/InterestCounter'
import DeliveryAdvantages from '@/features/product-details/ui/DeliveryAdvantages'
import ProductTabs from '@/features/product-details/ui/ProductTabs'
import ProductCarousel from '@/widgets/product-carousel/ui/ProductCarousel'
import StickyHeaderWithTrigger from '@/features/product-details/ui/StickyHeaderWithTrigger'
import TrackRecentlyViewed from '@/features/product-details/ui/TrackRecentlyViewed'
import {
	CompareButton,
	AddToCartButton,
} from '@/features/product-details/ui/ProductActions'
import {
	getProductBySlug,
	getAllProducts,
	getQuickSpecs,
	getProductSpecGroups,
} from '@/entities/product/api/productService'
import { toCatalogCardProps } from '@/entities/product/model/adapters'
import { notFound } from 'next/navigation'

/* ── Page ── */

export const dynamic = 'force-dynamic'

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const product = await getProductBySlug(slug)
	if (!product) return { title: 'Товар не найден' }

	return {
		title: `${product.name} — купить в Аура Света`,
		description:
			product.description || `${product.name} в интернет-магазине Аура Света`,
		openGraph: {
			title: product.name,
			description: product.description,
			images: product.images.length > 0 ? [product.images[0]] : undefined,
		},
	}
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

	const allProducts = await getAllProducts()
	const similarProducts = allProducts
		.filter(p => p.category === product.category && p.id !== product.id)
		.slice(0, 5)
		.map(toCatalogCardProps)

	const collectionProducts = allProducts
		.filter(p => p.brand === product.brand && p.id !== product.id)
		.slice(0, 5)
		.map(toCatalogCardProps)

	const allImages = [
		...(product.imagePath ? [product.imagePath] : []),
		...product.images,
	]
	const productImages = allImages.length > 0 ? allImages : ['/bulb.svg']
	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<TrackRecentlyViewed productId={String(product.id)} />
			{/* Sticky header on scroll */}
			<StickyHeaderWithTrigger
				triggerId='product-tabs'
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

				{/* Similar products carousel */}
				<ProductCarousel title='Похожие товары' products={similarProducts} />

				{/* Collection products carousel */}
				<ProductCarousel
					title='Товары из этой коллекции'
					products={collectionProducts}
				/>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}
