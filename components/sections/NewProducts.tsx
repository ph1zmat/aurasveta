import Link from 'next/link'
import ProductCard from '@/components/ui/ProductCard'
import { mockProducts } from '@/mocks/products'
import { toProductCardProps } from '@/services/productAdapters'

const newProducts = mockProducts
	.filter(p => p.badges?.includes('Новинка'))
	.concat(mockProducts.filter(p => !p.badges?.includes('Новинка')))
	.slice(0, 8)
	.map(toProductCardProps)

export default function NewProducts() {
	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
				{newProducts.map(product => (
					<ProductCard key={product.href} {...product} />
				))}
			</div>

			<div className='mt-8 flex justify-center'>
				<Link
					href='/new'
					className='rounded-lg border-2 border-foreground px-8 py-3 text-sm font-medium uppercase tracking-wider text-foreground transition-colors hover:bg-foreground hover:text-card'
				>
					Все новинки
				</Link>
			</div>
		</section>
	)
}
