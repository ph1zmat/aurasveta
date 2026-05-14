import type { Metadata } from 'next'
import type { Prisma } from '@prisma/client'
import Link from 'next/link'
import Image from 'next/image'
import TopBar from '@/widgets/header/ui/topbar'
import Header from '@/widgets/header/ui/headerserver'
import CategoryNav from '@/widgets/navigation/ui/categorynav'
import Footer from '@/widgets/footer/ui/footer'
import PublicSectionRenderer from '@/entities/section/ui/publicsectionrenderer'
import DynamicHomeSection from '@/widgets/home-sections/ui/dynamichomesection'
import { getUnifiedHomePageRenderData } from '@/lib/sections/publicpagedata'
import { logDatabaseFallback } from '@/lib/utils/dbfallbacklogger'
import { prisma } from '@/lib/prisma'
import { resolveStorageFileUrl } from '@/shared/lib/storagefileurl'
import { getProductImageUrl } from '@/shared/lib/productutils'

export const metadata: Metadata = {
	title: 'Аура Света — магазин люстр и светильников в Мозыре',
	description:
		'Аура Света — купить люстры, бра, потолочные светильники и декор в Мозыре. Широкий ассортимент, доставка по Беларуси.',
	openGraph: {
		url: 'https://aurasveta.by',
		type: 'website',
		images: [{ url: '/images/og-home.jpg', width: 1200, height: 630, alt: 'Аура Света' }],
	},
	alternates: {
		canonical: 'https://aurasveta.by',
	},
}

export const revalidate = 3600

const homeSectionsInclude = { sectionType: true } as const
type HomeSectionWithType = Prisma.HomeSectionGetPayload<{
	include: typeof homeSectionsInclude
}>

export default async function Home() {
	let unifiedPage = null

	try {
		unifiedPage = await getUnifiedHomePageRenderData()
	} catch (error) {
		logDatabaseFallback('home.unified-sections', error)
	}

	const unifiedSections = unifiedPage?.sections ?? []

	// Fallback to HomeSection records if no unified CMS page
	let legacySections: HomeSectionWithType[] = []
	if (unifiedSections.length === 0) {
		try {
			legacySections = await prisma.homeSection.findMany({
				where: { isActive: true },
				orderBy: { order: 'asc' },
				include: homeSectionsInclude,
			})
		} catch (error) {
			logDatabaseFallback('home.legacy-sections', error)
		}
	}

	// SEO: дополнительные внутренние ссылки на популярные категории и товары
	let popularCategories: Array<{
		id: string
		name: string
		slug: string
		imageUrl: string | null
	}> = []
	let featuredProducts: Array<{
		id: string
		name: string
		slug: string
		price: number
		imageUrl: string | null
	}> = []

	try {
		popularCategories = await prisma.category.findMany({
			where: { isActive: true, parentId: null },
			take: 8,
			orderBy: { order: 'asc' },
			select: { id: true, name: true, slug: true, imageUrl: true },
		})
	} catch {
		/* игнорируем — это дополнительный SEO-блок */
	}

	try {
		featuredProducts = await prisma.product.findMany({
			where: { isActive: true },
			take: 6,
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				name: true,
				slug: true,
				price: true,
				imageUrl: true,
				images: { select: { url: true }, take: 1 },
			},
		})
	} catch {
		/* игнорируем — это дополнительный SEO-блок */
	}

	return (
		<div className='flex flex-col bg-background'>
			<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				{unifiedSections.length > 0 ? (
					unifiedSections.map(section => (
						<PublicSectionRenderer key={section.id} section={section} />
					))
				) : legacySections.length > 0 ? (
					legacySections.map(section => (
						<DynamicHomeSection key={section.id} section={section} />
					))
				) : (
					<div className='mx-auto max-w-7xl px-4 py-12 text-center text-sm text-muted-foreground'>
						Секции главной страницы не настроены в CMS.
					</div>
				)}

				{/* SEO: блок популярных категорий с прямыми ссылками */}
				{popularCategories.length > 0 && (
					<section className='py-10'>
						<h2 className='mb-6 text-xl font-semibold uppercase tracking-widest text-foreground md:text-2xl'>
							Популярные категории
						</h2>
						<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'>
							{popularCategories.map(cat => (
								<Link
									key={cat.id}
									href={`/catalog/${cat.slug}`}
									className='group flex flex-col items-center rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40'
								>
									{cat.imageUrl ? (
										<Image
											src={resolveStorageFileUrl(cat.imageUrl) ?? '/bulb.svg'}
											alt={cat.name}
											width={120}
											height={120}
											className='mb-3 h-24 w-24 rounded-lg object-cover'
										/>
									) : (
										<div className='mb-3 flex h-24 w-24 items-center justify-center rounded-lg bg-muted'>
											<span className='text-2xl'>💡</span>
										</div>
									)}
									<span className='text-center text-sm font-medium text-foreground group-hover:text-accent'>
										{cat.name}
									</span>
								</Link>
							))}
						</div>
					</section>
				)}

				{/* SEO: блок новых товаров с прямыми ссылками */}
				{featuredProducts.length > 0 && (
					<section className='py-10'>
						<h2 className='mb-6 text-xl font-semibold uppercase tracking-widest text-foreground md:text-2xl'>
							Новинки
						</h2>
						<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6'>
							{featuredProducts.map(product => {
								const image =
									getProductImageUrl(product as unknown as { images: Array<{ url?: string | null }>; imageUrl?: string | null }) ??
									'/bulb.svg'
								return (
									<Link
										key={product.id}
										href={`/product/${product.slug}`}
										className='group flex flex-col rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40'
									>
										<Image
											src={image}
											alt={product.name}
											width={200}
											height={200}
											className='mb-2 aspect-square w-full rounded-lg object-cover'
										/>
										<span className='line-clamp-2 text-xs font-medium text-foreground group-hover:text-accent'>
											{product.name}
										</span>
										<span className='mt-1 text-xs font-semibold text-primary'>
											{product.price.toFixed(2)} BYN
										</span>
									</Link>
								)
								})}
							</div>
					</section>
				)}
			</main>

			<Footer />
		</div>
	)
}
