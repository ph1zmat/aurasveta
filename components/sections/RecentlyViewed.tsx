import ProductCard from '@/components/ui/ProductCard'
import { mockProducts } from '@/mocks/products'
import { toProductCardProps } from '@/services/productAdapters'

const recentProducts = mockProducts.slice(-2).map(toProductCardProps)

export default function RecentlyViewed() {
	if (recentProducts.length === 0) return null

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<h2 className='mb-4 text-base font-bold uppercase tracking-wider text-foreground md:mb-6 md:text-lg'>
				Вы смотрели
			</h2>
			<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
				{recentProducts.map(product => (
					<ProductCard key={product.href} {...product} />
				))}
			</div>
		</section>
	)
}
