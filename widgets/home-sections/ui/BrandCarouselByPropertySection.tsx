import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Slider } from '@/shared/ui/Slider'
import { resolveCatalogLinkHref } from '@/lib/home-sections/catalog-link-resolver'

interface BrandCarouselByPropertyConfig {
	propertySlug?: string
	/** URL filter parameter name; defaults to propertySlug */
	filterParam?: string
	viewAllHref?: string
	viewAllLabel?: string
	linkCategoryId?: string
	linkPropertyId?: string
	linkPropertyValueId?: string
	brandLinks?: Record<
		string,
		{
			href?: string
			linkCategoryId?: string
			linkPropertyId?: string
			linkPropertyValueId?: string
		}
	>
}

interface BrandCarouselByPropertySectionProps {
	title?: string | null
	config?: BrandCarouselByPropertyConfig
}

export default async function BrandCarouselByPropertySection({
	title,
	config,
}: BrandCarouselByPropertySectionProps) {
	const propertySlug = config?.propertySlug ?? 'brand'
	const filterParam = config?.filterParam ?? propertySlug
	const resolvedViewAllHref = await resolveCatalogLinkHref(prisma, {
		href: config?.viewAllHref,
		linkPropertyId: (config as Record<string, unknown> | undefined)
			?.linkPropertyId as string | undefined,
		linkPropertyValueId: (config as Record<string, unknown> | undefined)
			?.linkPropertyValueId as string | undefined,
		linkCategoryId: (config as Record<string, unknown> | undefined)
			?.linkCategoryId as string | undefined,
	})

	const property = await prisma.property.findUnique({
		where: { slug: propertySlug },
		select: {
			name: true,
			values: {
				orderBy: [{ order: 'asc' }, { value: 'asc' }],
				select: { id: true, value: true, slug: true, photo: true },
			},
		},
	})

	if (!property || property.values.length === 0) return null

	const items = await Promise.all(
		property.values.map(async item => {
			const customHref = await resolveCatalogLinkHref(prisma, {
				...(config?.brandLinks?.[item.id] ?? {}),
			})

			return {
				...item,
				href: customHref ?? `/catalog?prop.${filterParam}=${item.slug}`,
			}
		}),
	)

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<div className='mb-4 flex items-center justify-between md:mb-6'>
				<h2 className='text-base font-semibold uppercase tracking-widest text-foreground md:text-lg'>
					{title ?? property.name}
				</h2>
				{resolvedViewAllHref ? (
					<a
						href={resolvedViewAllHref}
						className='text-xs text-muted-foreground underline-offset-4 hover:underline md:text-sm'
					>
						{config?.viewAllLabel ?? 'Смотреть все'}
					</a>
				) : null}
			</div>
			<Slider
				visibleItems={6}
				gap={16}
				arrows
				arrowsPosition='outside'
				dots
				loop
				slideClassName='h-full'
				breakpoints={{
					0: { visibleItems: 2, gap: 8 },
					480: { visibleItems: 3, gap: 10 },
					768: { visibleItems: 4, gap: 12 },
					1024: { visibleItems: 6, gap: 16 },
				}}
			>
				{items.map(item => (
					<Link
						key={item.id}
						href={item.href}
						className='group flex max-h-64 max-w-64 flex-col items-center gap-3 rounded-2xl border border-border transition-colors hover:border-primary/40'
					>
						<div className='flex h-[144px] w-full items-center justify-center overflow-hidden rounded-xl bg-muted/20'>
							{item.photo ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={
										item.photo.startsWith('http')
											? item.photo
											: `/api/storage/file?key=${item.photo}`
									}
									alt={item.value}
									className='h-full w-full object-cover'
								/>
							) : (
								<span className='px-3 text-center text-xs font-medium text-muted-foreground w-full h-full flex items-center justify-center'>
									{item.value}
								</span>
							)}
						</div>
					</Link>
				))}
			</Slider>
		</section>
	)
}
