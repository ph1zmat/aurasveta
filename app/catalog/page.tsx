import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import CategoryNav from '@/components/layout/CategoryNav'
import Footer from '@/components/layout/Footer'
import ChatButton from '@/components/ui/ChatButton'
import CatalogCategoryCarousel from '@/components/catalog/CatalogCategoryCarousel'
import CategorySection from '@/components/catalog/CategorySection'
import { mockCategories } from '@/mocks/categories'
import { mockProducts } from '@/mocks/products'
import { toCatalogCardProps } from '@/services/productAdapters'

const chandelierProducts = mockProducts
	.filter(p => p.category === 'Люстры')
	.slice(0, 4)
	.map(toCatalogCardProps)

const wallLampProducts = mockProducts
	.filter(p => p.category === 'Бра')
	.slice(0, 4)
	.map(toCatalogCardProps)

export default function CatalogPage() {
	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<main className='flex-1 container mx-auto max-w-7xl'>
				<TopBar />
				<Header />
				<CategoryNav />

				{/* Page heading */}
				<div className='py-8'>
					<h1 className='text-2xl font-bold uppercase tracking-wider text-foreground'>
						Каталог
					</h1>
					<p className='mt-2 text-sm text-muted-foreground'>
						Товары каталога представлены в категориях
					</p>
				</div>

				{/* Category carousel */}
				<CatalogCategoryCarousel categories={mockCategories} />

				{/* Category sections */}
				<CategorySection
					title='Люстры'
					allHref='/catalog/lustry'
					allLabel='Все Люстры'
					products={chandelierProducts}
				/>

				<CategorySection
					title='Бра'
					allHref='/catalog/bra'
					allLabel='Все Бра'
					products={wallLampProducts}
				/>
			</main>

			<Footer />
			<ChatButton />
		</div>
	)
}
