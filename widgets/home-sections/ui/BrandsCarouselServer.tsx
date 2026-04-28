import { prisma } from '@/lib/prisma'
import BrandsCarousel from './BrandsCarousel'
import BrandCarouselByPropertySection from './BrandCarouselByPropertySection'

export default async function BrandsCarouselServer({
	title,
	config,
}: {
	title?: string | null
	config?: Record<string, unknown> | null
}) {
	const propertySlug = (config?.propertySlug as string | undefined) ?? 'brand'
	const property = await prisma.property.findUnique({
		where: { slug: propertySlug },
		select: { id: true, values: { select: { id: true }, take: 1 } },
	})

	if (property?.values.length) {
		return (
			<BrandCarouselByPropertySection
				title={title}
				config={{
					propertySlug,
					filterParam:
						(config?.filterParam as string | undefined) ?? propertySlug,
					viewAllHref: config?.viewAllHref as string | undefined,
					viewAllLabel: config?.viewAllLabel as string | undefined,
					linkCategoryId: config?.linkCategoryId as string | undefined,
					linkPropertyId: config?.linkPropertyId as string | undefined,
					linkPropertyValueId: config?.linkPropertyValueId as
						| string
						| undefined,
					brandLinks: (config?.brandLinks as
						| Record<
								string,
								{
									href?: string
									linkCategoryId?: string
									linkPropertyId?: string
									linkPropertyValueId?: string
								}
						  >
						| undefined),
				}}
			/>
		)
	}

	const rows = await prisma.product.findMany({
		where: { isActive: true, brand: { not: null } },
		select: { brand: true },
		distinct: ['brand'],
	})
	const brands = rows
		.map((r: { brand: string | null }) => r.brand)
		.filter((b: string | null): b is string => Boolean(b))
		.map((name: string) => ({
			name,
			slug: name.toLowerCase().replace(/\s+/g, '-'),
			href: `/catalog?prop.${
				(config?.filterParam as string | undefined) ?? propertySlug
			}=${name.toLowerCase().replace(/\s+/g, '-')}`,
		}))

	const heading = (config?.heading as string | undefined) ?? title ?? 'Бренды'

	return (
		<BrandsCarousel
			brands={brands}
			heading={heading}
			viewAllHref={config?.viewAllHref as string | undefined}
			viewAllLabel={config?.viewAllLabel as string | undefined}
		/>
	)
}
