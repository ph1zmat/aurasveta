import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/entities/product/ui/ProductCard'
import { productImageSelect } from '@/lib/products/product-images'
import {
	toFrontendProduct,
	toProductCardProps,
} from '@/entities/product/model/adapters'
import { resolveCatalogLinkHref } from '@/lib/home-sections/catalog-link-resolver'

interface ProductGridSectionConfig {
	source?:
		| 'promotion'
		| 'novelty'
		| 'popular'
		| 'property'
		| 'propertyValue'
		| 'category'
	propertyValueId?: string
	categoryId?: string
	limit?: number
	sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
	viewAllHref?: string
	viewAllLabel?: string
	/** Grid columns: 2, 3, 4 (default) or 6 */
	cols?: 2 | 3 | 4 | 6
}

interface ProductGridSectionProps {
	title?: string | null
	config?: ProductGridSectionConfig
}

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
	rating: true,
	reviewsCount: true,
	category: { select: { name: true, slug: true } },
} as const

export default async function ProductGridSection({
	title,
	config,
}: ProductGridSectionProps) {
	const source = config?.source ?? 'promotion'
	const limit = Math.min(Math.max(config?.limit ?? 8, 1), 24)
	const sortBy = config?.sortBy ?? 'newest'
	const cols = config?.cols ?? 4
	const resolvedViewAllHref = await resolveCatalogLinkHref(prisma, {
		href: config?.viewAllHref,
		categoryId: config?.source === 'category' ? config?.categoryId : undefined,
		propertyId:
			config?.source === 'property'
				? ((config as Record<string, unknown>)?.propertyId as
						| string
						| undefined)
				: undefined,
		_propertyId:
			config?.source === 'property'
				? ((config as Record<string, unknown>)?._propertyId as
						| string
						| undefined)
				: undefined,
		propertyValueId:
			config?.source === 'property' ? config?.propertyValueId : undefined,
	})
	const gridClass =
		cols === 2
			? 'grid-cols-2'
			: cols === 3
				? 'grid-cols-2 md:grid-cols-3'
				: cols === 6
					? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
					: 'grid-cols-2 md:grid-cols-4'

	const where: Prisma.ProductWhereInput = {
		isActive: true,
	}

	switch (source) {
		case 'promotion':
			where.compareAtPrice = { not: null }
			break
		case 'property':
		case 'propertyValue':
			if (config?.propertyValueId) {
				where.properties = { some: { propertyValueId: config.propertyValueId } }
			}
			break
		case 'category':
			if (config?.categoryId) {
				where.categoryId = config.categoryId
			}
			break
		case 'novelty':
		case 'popular':
		default:
			break
	}

	let orderBy: Prisma.ProductOrderByWithRelationInput = {
		createdAt: 'desc',
	}
	if (source === 'popular' || sortBy === 'popular')
		orderBy = { reviewsCount: 'desc' }
	else if (sortBy === 'price_asc') orderBy = { price: 'asc' }
	else if (sortBy === 'price_desc') orderBy = { price: 'desc' }

	let products = await prisma.product.findMany({
		where,
		orderBy,
		take: limit,
		select: productSelect,
	})

	if (source === 'novelty' && products.length < limit) {
		const seen = new Set(products.map(p => p.id))
		const fill = await prisma.product.findMany({
			where: { isActive: true, id: { notIn: [...seen] } },
			orderBy: { createdAt: 'desc' },
			take: limit - products.length,
			select: productSelect,
		})
		products = [...products, ...fill]
	}

	if (products.length === 0) return null

	const cards = products.map(toFrontendProduct).map(toProductCardProps)

	const heading =
		title ??
		(source === 'promotion'
			? 'Акции и скидки'
			: source === 'novelty'
				? 'Новинки'
				: source === 'popular'
					? 'Популярные товары'
					: source === 'category'
						? 'Товары из категории'
						: 'Товары')

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<div className='mb-4 flex items-center justify-between md:mb-6'>
				<h2 className='text-base font-semibold uppercase tracking-widest text-foreground md:text-lg'>
					{heading}
				</h2>
				{resolvedViewAllHref ? (
					<Link
						href={resolvedViewAllHref}
						className='text-xs text-muted-foreground underline-offset-4 hover:underline md:text-sm'
					>
						{config?.viewAllLabel ?? 'Смотреть все'}
					</Link>
				) : null}
			</div>
			<div className={`grid gap-4 ${gridClass}`}>
				{cards.map(product => (
					<ProductCard key={product.href} {...product} />
				))}
			</div>
		</section>
	)
}
