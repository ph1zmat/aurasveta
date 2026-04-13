import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import CatalogContent from './CatalogContent'
import { Suspense } from 'react'
import Skeleton from '@/shared/ui/Skeleton'

export const metadata = {
	title: 'Каталог — Аура Света',
	description:
		'Каталог люстр и светильников. Широкий ассортимент от ведущих производителей.',
}

export default function CatalogPage() {
	return (
		<div className='flex flex-col bg-background'>
			<main className='min-h-screen flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
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

				<Suspense
					fallback={
						<div className='py-8'>
							<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
								{Array.from({ length: 8 }).map((_, i) => (
									<div key={i} className='space-y-3'>
										<Skeleton className='h-28 w-full rounded-xl' />
										<Skeleton className='h-4 w-3/4' />
										<Skeleton className='h-3 w-1/2' />
									</div>
								))}
							</div>
						</div>
					}
				>
					<CatalogContent />
				</Suspense>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}
