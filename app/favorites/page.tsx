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
import { Button } from '@/components/ui/Button'

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
			<main className='flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />

				{/* Heading */}
				<div className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between md:py-6'>
					<h1 className='text-lg font-bold uppercase tracking-wider text-foreground md:text-xl'>
						Избранное
					</h1>
					<Button variant='ghost' className='uppercase tracking-wider'>
						Удалить все
					</Button>
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
