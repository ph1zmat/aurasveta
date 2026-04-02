import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import CategoryNav from '@/components/layout/CategoryNav'
import Footer from '@/components/layout/Footer'
import ChatButton from '@/components/ui/ChatButton'
import FavoritesCategoryTabs from '@/components/favorites/FavoritesCategoryTabs'
import type { FavoritesTab } from '@/components/favorites/FavoritesCategoryTabs'
import CompareProductCard from '@/components/compare/CompareProductCard'
import CompareFilterRadio from '@/components/compare/CompareFilterRadio'
import CompareSpecsTable from '@/components/compare/CompareSpecsTable'
import { mockProducts } from '@/mocks/products'
import { toCompareCardProps } from '@/services/productAdapters'
import { getCompareSpecsFor } from '@/mocks/specs'

/* ── Mock data ── */

const compareProducts = mockProducts
	.filter(p => p.category === 'Уличные светильники')
	.slice(0, 3)

const tabs: FavoritesTab[] = [
	{
		label: 'Уличные светильники',
		count: compareProducts.length,
		value: 'outdoor',
	},
]

const products = compareProducts.map(toCompareCardProps)

const specSections = getCompareSpecsFor('ulichnye')

/* ── Page ── */

export default function ComparePage() {
	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<main className='flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				{/* Heading */}
				<div className='flex items-center justify-between py-6'>
					<h1 className='text-xl font-bold uppercase tracking-wider text-foreground'>
						Сравнение
					</h1>
					<button className='text-sm text-muted-foreground transition-colors hover:text-foreground'>
						Очистить сравнение
					</button>
				</div>

				{/* Category tabs */}
				<FavoritesCategoryTabs tabs={tabs} defaultValue='outdoor' />

				{/* Items count */}
				<p className='py-4 text-sm text-muted-foreground'>
					{products.length} товара
				</p>

				{/* Products row + filter radio */}
				<div className='grid grid-cols-[280px_repeat(3,1fr)] gap-x-6 pb-8'>
					{/* Filter radio (left column, vertically centered) */}
					<div className='flex items-start pt-2'>
						<CompareFilterRadio />
					</div>

					{/* Product cards */}
					{products.map(product => (
						<CompareProductCard key={product.href} {...product} />
					))}
				</div>

				{/* Specs comparison table */}
				<CompareSpecsTable sections={specSections} />
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}
