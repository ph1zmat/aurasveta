import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import CategoryNav from '@/components/layout/CategoryNav'
import Footer from '@/components/layout/Footer'
import ChatButton from '@/components/ui/ChatButton'
import FavoritesCategoryTabs from '@/components/favorites/FavoritesCategoryTabs'
import FavoriteProductCard from '@/components/favorites/FavoriteProductCard'
import type { FavoritesTab } from '@/components/favorites/FavoritesCategoryTabs'
import { mockProducts } from '@/mocks/products'
import { toFavoriteCardProps } from '@/services/productAdapters'

/* ── Mock data from central store ── */

const favoriteProducts = mockProducts
	.filter(p => p.category === 'Уличные светильники')
	.slice(0, 3)

const tabs: FavoritesTab[] = [
	{ label: 'Все', count: favoriteProducts.length, value: 'all' },
	{
		label: 'Уличные светильники',
		count: favoriteProducts.length,
		value: 'outdoor',
	},
]

const products = favoriteProducts.map(toFavoriteCardProps)

/* ── Page ── */

export default function FavoritesPage() {
	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<main className='flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				{/* Heading */}
				<div className='flex items-center justify-between py-6'>
					<h1 className='text-xl font-bold uppercase tracking-wider text-foreground'>
						Избранное
					</h1>
					<button className='text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground'>
						Удалить все
					</button>
				</div>

				{/* Category tabs */}
				<FavoritesCategoryTabs tabs={tabs} defaultValue='all' />

				{/* Items count */}
				<p className='py-4 text-sm text-muted-foreground'>
					{products.length} товара
				</p>

				{/* Product grid */}
				<div className='grid grid-cols-1 gap-6 pb-8 sm:grid-cols-2 lg:grid-cols-3'>
					{products.map(product => (
						<FavoriteProductCard key={product.href} {...product} />
					))}
				</div>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}
