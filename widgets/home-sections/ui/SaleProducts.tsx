import Link from 'next/link'
import ProductCard from '@/entities/product/ui/ProductCard'
import {
	toProductCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { prisma } from '@/lib/prisma'

export default async function SaleProducts() {
	const dbProducts = await prisma.product.findMany({
		where: {
			isActive: true,
			compareAtPrice: { not: null },
		},
		orderBy: { createdAt: 'desc' },
		take: 8,
		select: {
			id: true,
			slug: true,
			name: true,
			description: true,
			price: true,
			compareAtPrice: true,
			stock: true,
			images: true,
			imagePath: true,
			brand: true,
			createdAt: true,
			badges: true,
			category: { select: { name: true, slug: true } },
		},
	})

	const saleProducts = dbProducts.map(toFrontendProduct).map(toProductCardProps)

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
					className='rounded-md border-2 border-foreground px-8 py-3 text-sm font-normal uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-card'
				>
					Все товары по акции
				</Link>
			</div>
		</section>
	)
}
