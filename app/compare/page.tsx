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
import { Button } from '@/components/ui/Button'
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
			<main className='flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<TopBar />
				<Header />
				<CategoryNav />

				{/* Heading */}
				<div className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between md:py-6'>
					<h1 className='text-lg font-bold uppercase tracking-wider text-foreground md:text-xl'>
						Сравнение
					</h1>
					<Button variant='ghost'>
						Очистить сравнение
					</Button>
				</div>

				{/* Category tabs */}
				<FavoritesCategoryTabs tabs={tabs} defaultValue='outdoor' />

				{/* Items count */}
				<p className='py-4 text-sm text-muted-foreground'>
					{products.length} товара
				</p>

				{/* Products row + filter radio */}
				<div className='overflow-x-auto pb-4 scrollbar-hide'>
					<div className='grid min-w-[700px] grid-cols-[160px_repeat(3,1fr)] gap-x-4 pb-8 md:min-w-0 md:grid-cols-[280px_repeat(3,1fr)] md:gap-x-6'>
					{/* Filter radio (left column, vertically centered) */}
					<div className='flex items-start pt-2'>
						<CompareFilterRadio />
					</div>

					{/* Product cards */}
					{products.map(product => (
						<CompareProductCard key={product.href} {...product} />
					))}
					</div>
				</div>

				{/* Specs comparison table */}
				<CompareSpecsTable sections={specSections} />
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}
