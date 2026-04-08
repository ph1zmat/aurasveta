import Link from 'next/link'
import ProductCard from '@/entities/product/ui/ProductCard'
import {
	toProductCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { prisma } from '@/lib/prisma'

const productSelect = {
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
	brandCountry: true,
	badges: true,
	createdAt: true,
	category: { select: { name: true, slug: true } },
} as const

export default async function NewProducts() {
	// Two queries: first badged "Новинка", then fill remaining from newest
	const [badged, newest] = await Promise.all([
		prisma.product.findMany({
			where: { isActive: true, badges: { array_contains: ['Новинка'] } },
			orderBy: { createdAt: 'desc' },
			take: 8,
			select: productSelect,
		}),
		prisma.product.findMany({
			where: { isActive: true },
			orderBy: { createdAt: 'desc' },
			take: 8,
			select: productSelect,
		}),
	])

	const seen = new Set(badged.map(p => p.id))
	const fill = newest.filter(p => !seen.has(p.id))
	const combined = [...badged, ...fill].slice(0, 8)
	const newProducts = combined.map(toFrontendProduct).map(toProductCardProps)

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
					className='rounded-md border-2 border-foreground px-8 py-3 text-sm font-normal uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-card'
				>
					Все новинки
				</Link>
			</div>
		</section>
	)
}
