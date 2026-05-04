import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/HeaderServer'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import CatalogContent from './CatalogContent'
import { Suspense } from 'react'
import { trpc, HydrateClient } from '@/lib/trpc/server'
import { CatalogContentSkeleton } from '@/shared/ui/storefront-skeletons'

export const revalidate = 300 // 5 мин ISR

export const metadata = {
	title: 'Каталог — Аура Света',
	description:
		'Каталог люстр и светильников. Широкий ассортимент от ведущих производителей.',
}

export default async function CatalogPage() {
	// Prefetch data on the server for instant hydration
	void trpc.categories.getTree.prefetch()
	void trpc.products.getMany.prefetch({ page: 1, limit: 24 })

	return (
		<HydrateClient>
			<div className='flex flex-col bg-background'>
				<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
					<TopBar />
					<Header />
					<CategoryNav />

					<div className='py-5 md:py-8'>
						<h1 className='text-lg font-semibold uppercase tracking-widest text-foreground md:text-2xl'>
							Каталог
						</h1>
						<p className='mt-2 text-sm tracking-wider text-muted-foreground'>
							Товары каталога представлены в категориях
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
