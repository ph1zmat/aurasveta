import TopBar from '@/widgets/header/ui/TopBar'
import Header from '@/widgets/header/ui/Header'
import CategoryNav from '@/widgets/navigation/ui/CategoryNav'
import Footer from '@/widgets/footer/ui/Footer'
import ChatButton from '@/shared/ui/ChatButton'
import FavoritesContent from './FavoritesContent'
import { Suspense } from 'react'
import { FavoritesContentSkeleton } from '@/shared/ui/storefront-skeletons'

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
					fallback={<FavoritesContentSkeleton />}
				>
					<FavoritesContent />
				</Suspense>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}
