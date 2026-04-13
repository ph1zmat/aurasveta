import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import FavoritesContent from './FavoritesContent'
import { Suspense } from 'react'
import Skeleton from '@/shared/ui/Skeleton'

export const metadata = {
	title: 'Избранное — Аура Света',
}

export default function FavoritesPage() {
	return (
		<div className='flex flex-col bg-background'>
			<main className='min-h-screen flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />

				<Suspense
					fallback={
						<div className='py-8'>
							<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
								{Array.from({ length: 6 }).map((_, i) => (
									<div
										key={i}
										className='rounded-2xl border border-border p-4 space-y-3'
									>
										<Skeleton className='h-40 w-full rounded-xl' />
										<Skeleton className='h-4 w-4/5' />
										<Skeleton className='h-4 w-1/2' />
										<Skeleton className='h-10 w-full rounded-lg' />
									</div>
								))}
							</div>
						</div>
					}
				>
					<FavoritesContent />
				</Suspense>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}
