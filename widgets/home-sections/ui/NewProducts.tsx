import Link from 'next/link'
import ProductCard from '@/entities/product/ui/ProductCard'
import {
	toProductCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { productImageSelect } from '@/lib/products/product-images'
import { prisma } from '@/lib/prisma'
import { resolveCatalogLinkHref } from '@/lib/home-sections/catalog-link-resolver'

const orderedProductImages = {
	orderBy: { order: 'asc' as const },
	select: productImageSelect,
}

const productSelect = {
	id: true,
	slug: true,
	name: true,
	description: true,
	price: true,
	compareAtPrice: true,
	stock: true,
	images: orderedProductImages,
	brand: true,
	brandCountry: true,
	badges: true,
	createdAt: true,
	category: { select: { name: true, slug: true } },
} as const

export default async function NewProducts({
	title,
	config,
}: {
	title?: string | null
	config?: Record<string, unknown> | null
}) {
	const heading = (config?.heading as string | undefined) ?? title ?? 'Новинки'
	const limit = (config?.limit as number | undefined) ?? 8
	const viewAllHref =
		(await resolveCatalogLinkHref(prisma, {
			href: config?.viewAllHref as string | undefined,
			linkCategoryId: config?.linkCategoryId as string | undefined,
			linkPropertyId: config?.linkPropertyId as string | undefined,
			linkPropertyValueId: config?.linkPropertyValueId as string | undefined,
		})) ?? '/new'
	const viewAllLabel =
		(config?.viewAllLabel as string | undefined) ?? 'Все новинки'

	// Two queries: first badged "Новинка", then fill remaining from newest
	const [badged, newest] = await Promise.all([
		prisma.product.findMany({
			where: { isActive: true, badges: { array_contains: ['Новинка'] } },
			orderBy: { createdAt: 'desc' },
			take: limit,
			select: productSelect,
		}),
		prisma.product.findMany({
			where: { isActive: true },
			orderBy: { createdAt: 'desc' },
			take: limit,
			select: productSelect,
		}),
	])

	const seen = new Set(badged.map(p => p.id))
	const fill = newest.filter(p => !seen.has(p.id))
	const combined = [...badged, ...fill].slice(0, limit)
	const newProducts = combined.map(toFrontendProduct).map(toProductCardProps)

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<div className='mb-4 flex items-center justify-between md:mb-6'>
				<h2 className='text-base font-semibold uppercase tracking-widest text-foreground md:text-lg'>
					{heading}
				</h2>
				{viewAllHref && (
					<Link
						href={viewAllHref}
						className='text-xs text-muted-foreground underline-offset-4 hover:underline md:text-sm'
					>
						{viewAllLabel}
					</Link>
				)}
			</div>
			<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
				{newProducts.map(product => (
					<ProductCard key={product.href} {...product} />
				))}
			</div>
		</section>
	)
}
