import Link from 'next/link'
import ProductCard from '@/components/ui/ProductCard'
import { mockProducts } from '@/mocks/products'
import { toProductCardProps } from '@/services/productAdapters'

const saleProducts = mockProducts
	.filter(p => p.oldPrice !== undefined)
	.slice(0, 8)
	.map(toProductCardProps)

export default function SaleProducts() {
	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
				{saleProducts.map(product => (
					<ProductCard key={product.href} {...product} />
				))}
			</div>

			<div className='mt-8 flex justify-center'>
				<Link
					href='/clearance'
					className='rounded-lg border-2 border-foreground px-8 py-3 text-sm font-medium uppercase tracking-wider text-foreground transition-colors hover:bg-foreground hover:text-card'
				>
					Все товары по акции
				</Link>
			</div>
		</section>
	)
}
