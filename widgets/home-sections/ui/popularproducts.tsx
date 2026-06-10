'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import InteractiveCatalogCard from '@/entities/product/ui/interactivecatalogcard'
import {
	toFrontendProduct,
	toCatalogCardProps,
} from '@/entities/product/model/adapters'
import type { DbProduct } from '@/entities/product/model/adapters'
import { Slider } from '@/shared/ui/slider'

export default function PopularProducts({
	title,
	config,
}: {
	title?: string | null
	config?: Record<string, unknown> | null
}) {
	const heading =
		(config?.heading as string | undefined) ?? title ?? 'Популярные товары'
	const limit = (config?.limit as number | undefined) ?? 10
	const linkCategoryId = config?.linkCategoryId as string | undefined
	const linkPropertyId = config?.linkPropertyId as string | undefined
	const linkPropertyValueId = config?.linkPropertyValueId as string | undefined
	const explicitViewAllHref =
		(config?.viewAllHref as string | undefined)?.trim() || ''
	const viewAllLabel =
		(config?.viewAllLabel as string | undefined) ?? 'Смотреть все'
	const categoriesQuery = trpc.categories.getAll.useQuery(undefined, {
		staleTime: 10 * 60 * 1000,
	})
	const { data: selectedProperty } = trpc.properties.getById.useQuery(
		linkPropertyId ?? '',
		{ enabled: Boolean(linkPropertyId), staleTime: 10 * 60 * 1000 },
	)
	const selectedCategory = categoriesQuery.data?.find(
		c => c.id === linkCategoryId,
	)
	const selectedPropertyValue = selectedProperty?.values.find(
		value => value.id === linkPropertyValueId,
	)
	const autoViewAllHref = selectedCategory?.slug
		? `/catalog/${selectedCategory.slug}`
		: selectedProperty?.slug && selectedPropertyValue?.slug
			? `/catalog?prop.${selectedProperty.slug}=${selectedPropertyValue.slug}`
			: ''
	const viewAllHref = explicitViewAllHref || autoViewAllHref

	const { data: products } = trpc.recommendations.getPopularProducts.useQuery(
		{ limit },
		{ staleTime: 10 * 60 * 1000 },
	)

	if (!products || products.length === 0) return null

	const cards = products.map(p =>
		toCatalogCardProps(toFrontendProduct(p as unknown as DbProduct)),
	)

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<div className='mb-5 flex items-end justify-between gap-4 md:mb-6'>
				<div>
					<p className='mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground'>
						Ассортимент
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
			<Slider
				visibleItems={5}
				gap={16}
				arrows
				arrowsPosition='inside'
				loop={false}
				breakpoints={{
					0: { visibleItems: 2, gap: 8 },
					480: { visibleItems: 2, gap: 12 },
					768: { visibleItems: 3, gap: 16 },
					1024: { visibleItems: 5, gap: 16 },
				}}
			>
				{cards.map(card => (
					<InteractiveCatalogCard key={card.productId} {...card} />
				))}
			</Slider>
		</section>
	)
}
