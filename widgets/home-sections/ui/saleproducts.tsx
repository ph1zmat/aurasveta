import Link from 'next/link'
import ProductCard from '@/entities/product/ui/productcard'
import {
	toProductCardProps,
	toFrontendProduct,
} from '@/entities/product/model/adapters'
import { productImageSelect } from '@/lib/products/productimages'
import { prisma } from '@/lib/prisma'
import { resolveCatalogLinkHref } from '@/lib/home-sections/cataloglinkresolver'

const orderedProductImages = {
	orderBy: { order: 'asc' as const },
	select: productImageSelect,
}

export default async function SaleProducts({
	title,
	config,
}: {
	title?: string | null
	config?: Record<string, unknown> | null
}) {
	const heading =
		(config?.heading as string | undefined) ?? title ?? 'Акции и скидки'
	const limit = (config?.limit as number | undefined) ?? 8
	const viewAllHref =
		(await resolveCatalogLinkHref(prisma, {
			href: config?.viewAllHref as string | undefined,
			linkCategoryId: config?.linkCategoryId as string | undefined,
			linkPropertyId: config?.linkPropertyId as string | undefined,
			linkPropertyValueId: config?.linkPropertyValueId as string | undefined,
		})) ?? '/clearance'
	const viewAllLabel =
		(config?.viewAllLabel as string | undefined) ?? 'Все акции'

	const dbProducts = await prisma.product.findMany({
		where: {
			isActive: true,
			compareAtPrice: { not: null },
		},
		orderBy: { createdAt: 'desc' },
		take: limit,
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
			<div className='mb-5 flex items-end justify-between gap-4 md:mb-6'>
				<div>
					<p className='mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
						Специальные предложения
					</p>
					<h2 className='text-lg font-semibold tracking-[0.04em] text-foreground'>
						{heading}
					</h2>
				</div>
				{viewAllHref && (
					<Link
						href={viewAllHref}
						className='shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline'
					>
						{viewAllLabel}
					</Link>
				)}
			</div>
			<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
				{saleProducts.map(product => (
					<ProductCard key={product.href} {...product} />
				))}
			</div>
		</section>
	)
}
