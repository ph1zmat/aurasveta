import TopBar from '@/widgets/header/ui/topbar'
import Header from '@/widgets/header/ui/headerserver'
import CategoryNav from '@/widgets/navigation/ui/categorynav'
import Footer from '@/widgets/footer/ui/footer'
import FavoritesContent from './favoritescontent'
import { Suspense } from 'react'
import { FavoritesContentSkeleton } from '@/shared/ui/storefrontskeletons'

export const metadata = {
	title: 'Избранное — Аура Света',
	robots: { index: false, follow: true },
}

export default function FavoritesPage() {
	return (
		<div className='flex flex-col bg-background'>
			<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				<Suspense fallback={<FavoritesContentSkeleton />}>
					<FavoritesContent />
				</Suspense>
			</main>

			<Footer />
		</div>
	)
}
