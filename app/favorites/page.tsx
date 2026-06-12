import FavoritesContent from './favoritescontent'

export const metadata = {
	title: 'Избранное — Аура Света',
	robots: { index: false, follow: true },
}

export default function FavoritesPage() {
	return (
		<div className='flex flex-col bg-background'>
			<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<FavoritesContent />
			</main>
		</div>
	)
}
