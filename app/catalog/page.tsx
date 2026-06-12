import type { Metadata } from 'next'
import CatalogContent from './catalogcontent'
import { publicTrpc, PublicHydrateClient } from '@/lib/trpc/server'
import BreadcrumbStructuredData from '@/shared/ui/breadcrumbstructureddata'

export const revalidate = 300 // 5 мин ISR

export const metadata: Metadata = {
	title: 'Каталог люстр и светильников в Мозыре',
	description:
		'Каталог люстр, бра, спотов и светильников в Мозыре. Актуальные цены в BYN, помощь с подбором и доставка по Беларуси.',
	openGraph: {
		url: 'https://aurasveta.by/catalog',
		type: 'website',
	},
	alternates: {
		canonical: 'https://aurasveta.by/catalog',
	},
}

export default async function CatalogPage() {
	// SSR-first: отдаем начальные данные каталога сразу с сервера
	const [initialCategoriesTree, initialFallbackProductsData] =
		await Promise.all([
			publicTrpc.categories.getTree(),
			publicTrpc.products.getMany({
				page: 1,
				limit: 8,
				sortBy: 'newest',
			}),
		])

	return (
		<PublicHydrateClient>
			{/* JSON-LD: BreadcrumbList для корневого каталога (SEO-CLAIM-034) */}
			<BreadcrumbStructuredData
				items={[{ name: 'Главная', href: '/' }, { name: 'Каталог' }]}
			/>
			<div className='flex flex-col bg-background'>
				<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
					<div className='py-5 md:py-8'>
						<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-2xl'>
							Каталог светильников в Мозыре
						</h1>
						<p className='mt-2 text-sm tracking-wider text-muted-foreground'>
							Люстры, бра, споты и декоративное освещение с доставкой по
							Беларуси
						</p>
					</div>

					<CatalogContent
						initialCategoriesTree={initialCategoriesTree}
						initialFallbackProductsData={initialFallbackProductsData}
					/>
				</main>
			</div>
		</PublicHydrateClient>
	)
}
