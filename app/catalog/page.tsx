import type { Metadata } from 'next'
import TopBar from '@/widgets/header/ui/topbar'
import Header from '@/widgets/header/ui/headerserver'
import CategoryNav from '@/widgets/navigation/ui/categorynav'
import Footer from '@/widgets/footer/ui/footer'
import CatalogContent from './catalogcontent'
import { Suspense } from 'react'
import { trpc, HydrateClient } from '@/lib/trpc/server'
import { CatalogContentSkeleton } from '@/shared/ui/storefrontskeletons'
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
	// Prefetch data on the server for instant hydration
	void trpc.categories.getTree.prefetch()
	void trpc.products.getMany.prefetch({ page: 1, limit: 24 })

	return (
		<HydrateClient>
			{/* JSON-LD: BreadcrumbList для корневого каталога (SEO-CLAIM-034) */}
			<BreadcrumbStructuredData
				items={[{ name: 'Главная', href: '/' }, { name: 'Каталог' }]}
			/>
			<div className='flex flex-col bg-background'>
				<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
					<TopBar />
					<Header />
					<CategoryNav />

					<div className='py-5 md:py-8'>
						<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-2xl'>
							Каталог светильников в Мозыре
						</h1>
						<p className='mt-2 text-sm tracking-wider text-muted-foreground'>
							Люстры, бра, споты и декоративное освещение с доставкой по Беларуси
						</p>
					</div>

					<Suspense fallback={<CatalogContentSkeleton />}>
						<CatalogContent />
					</Suspense>
				</main>

				<Footer />
			</div>
		</HydrateClient>
	)
}
