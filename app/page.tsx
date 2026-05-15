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
		imagePath: string | null
		image: string | null
	}> = []
	let featuredProducts: Array<{
		id: string
		name: string
		slug: string
		price: number | null
		images: Array<{ url: string }>
	}> = []

	try {
		popularCategories = await prisma.category.findMany({
			where: { parentId: null },
			take: 8,
			select: { id: true, name: true, slug: true, imagePath: true, image: true },
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

				{/* SEO: H1 заголовок главной страницы */}
				<h1 className='py-6 text-xl font-semibold uppercase tracking-widest text-foreground md:text-2xl'>
					Светотехника и осветительные приборы в Мозыре — Аура Света
				</h1>

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
							{popularCategories.map((cat, index) => {
								const imageSrc =
									resolveStorageFileUrl(cat.imagePath ?? cat.image) ??
									'/bulb.svg'
								return (
									<Link
										key={cat.id}
										href={`/catalog/${cat.slug}`}
										className='group flex flex-col items-center rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40'
									>
										<Image
											src={imageSrc}
											alt={cat.name}
											width={120}
											height={120}
											className='mb-3 h-24 w-24 rounded-lg object-cover'
											priority={index < 4}
											sizes='(max-width: 768px) 50vw, 25vw'
										/>
										<span className='text-center text-sm font-medium text-foreground group-hover:text-accent'>
											{cat.name}
										</span>
									</Link>
								)
								})}
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
							{featuredProducts.map((product, index) => {
								const imageSrc =
									product.images[0]?.url ?? '/bulb.svg'
								return (
									<Link
										key={product.id}
										href={`/product/${product.slug}`}
										className='group flex flex-col rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40'
									>
										<Image
											src={imageSrc}
											alt={product.name}
											width={200}
											height={200}
											className='mb-2 aspect-square w-full rounded-lg object-cover'
											priority={index < 3}
											sizes='(max-width: 768px) 50vw, 16vw'
										/>
										<span className='line-clamp-2 text-xs font-medium text-foreground group-hover:text-accent'>
											{product.name}
										</span>
										<span className='mt-1 text-xs font-semibold text-primary'>
											{product.price != null ? `${product.price.toFixed(2)} BYN` : 'Цена по запросу'}
										</span>
									</Link>
								)
								})}
						</div>
					</section>
				)}

				{/* SEO: текстовый блок для улучшения индексации */}
				<section className='py-10 border-t border-border/60'>
					<div className='prose prose-neutral dark:prose-invert max-w-none'>
						<h2 className='text-xl font-semibold uppercase tracking-widest text-foreground md:text-2xl mb-4'>
							О магазине Аура Света
						</h2>
						<p className='text-sm leading-relaxed text-muted-foreground'>
							Аура Света — это специализированный магазин светотехники в Мозыре, 
							где вы можете купить люстры, бра, споты, потолочные и настенные светильники 
							по доступным ценам. Мы предлагаем широкий ассортимент осветительных приборов 
							для дома, квартиры, офиса и коммерческих помещений. В каталоге представлены 
							как классические модели, так и современные LED-светильники с экономичным 
							потреблением энергии.
						</p>
						<p className='text-sm leading-relaxed text-muted-foreground mt-3'>
							Наши преимущества — быстрая доставка по всей Беларуси, профессиональная 
							консультация при выборе, гарантия качества на всю продукцию и удобная 
							система оплаты. Если вам нужно освещение для гостиной, спальни, кухни 
							или ванной комнаты — в Ауре Света вы найдёте идеальное решение. 
							Оформляйте заказ онлайн или посетите наш шоу-рум в Мозыре.
						</p>
					</div>
				</section>
			</main>

			<Footer />
		</div>
	)
}
