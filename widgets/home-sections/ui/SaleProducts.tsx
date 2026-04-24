import Link from 'next/link'
import ProductCard from '@/entities/product/ui/ProductCard'
import {
	toProductCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { productImageSelect } from '@/lib/products/product-images'
import { prisma } from '@/lib/prisma'

const orderedProductImages = {
	orderBy: { order: 'asc' as const },
	select: productImageSelect,
}

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
			images: orderedProductImages,
			brand: true,
			createdAt: true,
			badges: true,
			category: { select: { name: true, slug: true } },
		},
	})

	const saleProducts = dbProducts.map(toFrontendProduct).map(toProductCardProps)

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<div className='mb-4 flex items-center justify-between md:mb-6'>
				<h2 className='text-base font-semibold uppercase tracking-widest text-foreground md:text-lg'>
					Акции и скидки
				</h2>
				<Link
					href='/clearance'
					className='text-xs text-muted-foreground underline-offset-4 hover:underline md:text-sm'
				>
					Все акции
				</Link>
			</div>
			<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
				{saleProducts.map(product => (
					<ProductCard key={product.href} {...product} />
				))}
			</div>
		</section>
	)
}
